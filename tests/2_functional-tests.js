const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let initialSingleStockLikes;
  let likesAfterFirstLike;
  let likesBeforeTwoStockLike;

  test('Viewing one stock: GET request to /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices/')
      .query({ stock: 'GOOG' })
      .end(function(err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isObject(res.body.stockData);
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);
        initialSingleStockLikes = res.body.stockData.likes;
        done();
      });
  });

  test('Viewing one stock and liking it: GET request to /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices/')
      .query({ stock: 'GOOG', like: 'true' })
      .end(function(err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isObject(res.body.stockData);
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.equal(res.body.stockData.likes, initialSingleStockLikes + 1);
        likesAfterFirstLike = res.body.stockData.likes;
        done();
      });
  });

  test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices/')
      .query({ stock: 'GOOG', like: 'true' })
      .end(function(err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isObject(res.body.stockData);
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.equal(res.body.stockData.likes, likesAfterFirstLike);
        done();
      });
  });

  test('Viewing two stocks: GET request to /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices/')
      .query({ stock: ['GOOG', 'AAPL'] })
      .end(function(err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        assert.equal(res.body.stockData[0].stock, 'GOOG');
        assert.isNumber(res.body.stockData[0].price);
        assert.isNumber(res.body.stockData[0].rel_likes);
        assert.equal(res.body.stockData[1].stock, 'AAPL');
        assert.isNumber(res.body.stockData[1].price);
        assert.isNumber(res.body.stockData[1].rel_likes);
        likesBeforeTwoStockLike = res.body.stockData.map(stock => stock.rel_likes);
        done();
      });
  });

  test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices/')
      .query({ stock: ['GOOG', 'AAPL'], like: 'true' })
      .end(function(err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        assert.equal(res.body.stockData[0].stock, 'GOOG');
        assert.isNumber(res.body.stockData[0].price);
        assert.isNumber(res.body.stockData[0].rel_likes);
        assert.equal(res.body.stockData[1].stock, 'AAPL');
        assert.isNumber(res.body.stockData[1].price);
        assert.isNumber(res.body.stockData[1].rel_likes);
        assert.deepEqual(
          res.body.stockData.map(stock => stock.rel_likes),
          [likesBeforeTwoStockLike[0] - 1, likesBeforeTwoStockLike[1] + 1]
        );
        done();
      });
  });

});
