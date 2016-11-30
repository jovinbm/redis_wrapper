const BPromise    = require('bluebird');
const tape        = require('tape');
const test_config = require('../test');
const redis       = test_config.redis;

tape('hdel: Deletes hash keys', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rhmset({
      hash_name: 'test_hash_1',
      args     : {
        test_1: 'test_1',
        test_2: 'test_2',
        test_3: 'test_3'
      }
    }))
    .then(() => redis.rhdel({
      hash_name: 'test_hash_1',
      args     : ['test_1', 'test_2']
    }))
    .then(() => {
      
      return BPromise.map([
        () => redis.rhget({
          hash_name: 'test_hash_1',
          key_name : 'test_1'
        }),
        () => redis.rhget({
          hash_name: 'test_hash_1',
          key_name : 'test_2'
        }),
        () => redis.rhget({
          hash_name: 'test_hash_1',
          key_name : 'test_3'
        })
      ], d => d());
      
    })
    .then(([a, b, c]) => {
      
      t.equal(a, null);
      t.equal(b, null);
      t.equal(c, 'test_3');
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});