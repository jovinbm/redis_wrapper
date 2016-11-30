const BPromise    = require('bluebird');
const tape        = require('tape');
const test_config = require('../test');
const redis       = test_config.redis;

tape('flushdb: Flushes db', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rset({
      key_name: 'test1',
      data    : 'test1'
    }))
    .then(() => redis.rflushdb())
    .then(() => {
      
      return BPromise.map([
        () => redis.rget({
          key_name: 'test1'
        })
      ], d => d());
      
    })
    .then(([a]) => {
      
      t.equal(a, null);
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});