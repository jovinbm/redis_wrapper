const BPromise    = require('bluebird');
const tape        = require('tape');
const test_config = require('../test');
const redis       = test_config.redis;

tape('get: get gets keys', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rset({
      key_name: 'test1',
      data    : 'test1'
    }))
    .then(() => redis.rset({
      key_name: 'test2',
      data    : 'test2'
    }))
    .then(() => {
      
      return BPromise.map([
        () => redis.rget({
          key_name: 'test1'
        }),
        () => redis.rget({
          key_name: 'test2'
        })
      ], d => d());
      
    })
    .then(([a, b]) => {
      
      t.equal(a, 'test1');
      t.equal(b, 'test2');
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('get: get returns undefined for non-existent keys', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rflushdb())
    .then(() => {
      
      return BPromise.map([
        () => redis.rget({
          key_name: 'test1'
        }),
        () => redis.rget({
          key_name: 'test2'
        })
      ], d => d());
      
    })
    .then(([a, b]) => {
      
      t.equal(a, null);
      t.equal(b, null);
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});