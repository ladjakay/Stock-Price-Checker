'use strict';

const crypto = require('crypto');
const https = require('https');

const likesByStock = new Map();
const stockSymbolPattern = /^[A-Z0-9.-]{1,10}$/;

function getStockQuote(stock) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${encodeURIComponent(stock)}/quote`,
      response => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', chunk => {
          body += chunk;
        });
        response.on('end', () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Stock quote service returned ${response.statusCode}`));
            return;
          }

          try {
            const quote = JSON.parse(body);
            if (typeof quote.latestPrice !== 'number') {
              reject(new Error(`No price is available for ${stock}`));
              return;
            }
            resolve({ stock, price: quote.latestPrice });
          } catch (error) {
            reject(new Error(`Invalid response from stock quote service: ${error.message}`));
          }
        });
      }
    );

    request.setTimeout(10000, () => {
      request.destroy(new Error('Stock quote service timed out'));
    });
    request.on('error', reject);
  });
}

function getLikes(stock) {
  return likesByStock.get(stock)?.size || 0;
}

function addLike(stock, anonymizedIp) {
  if (!likesByStock.has(stock)) {
    likesByStock.set(stock, new Set());
  }
  likesByStock.get(stock).add(anonymizedIp);
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const requestedStocks = Array.isArray(req.query.stock)
        ? req.query.stock
        : [req.query.stock];

      if (
        requestedStocks.length < 1 ||
        requestedStocks.length > 2 ||
        requestedStocks.some(stock => typeof stock !== 'string')
      ) {
        return res.status(400).json({ error: 'Provide one or two stock symbols.' });
      }

      const stocks = requestedStocks.map(stock => stock.toUpperCase());
      if (stocks.some(stock => !stockSymbolPattern.test(stock))) {
        return res.status(400).json({ error: 'Invalid stock symbol.' });
      }

      try {
        const quotes = await Promise.all(stocks.map(getStockQuote));
        if (req.query.like === 'true') {
          const anonymizedIp = crypto
            .createHash('sha256')
            .update(req.ip)
            .digest('hex');
          stocks.forEach(stock => addLike(stock, anonymizedIp));
        }

        if (quotes.length === 1) {
          return res.json({
            stockData: {
              ...quotes[0],
              likes: getLikes(stocks[0])
            }
          });
        }

        const likes = stocks.map(getLikes);
        return res.json({
          stockData: quotes.map((quote, index) => ({
            ...quote,
            rel_likes: likes[index] - likes[1 - index]
          }))
        });
      } catch (error) {
        console.error('Unable to retrieve stock price:', error.message);
        return res.status(502).json({ error: 'Unable to retrieve stock price.' });
      }
    });

};
