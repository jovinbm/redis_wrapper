const BPromise    = require('bluebird');
const tape        = require('tape');
const test_config = require('../test');
const redis       = test_config.redis;

tape('del: Deletes keys', function (t) {
  
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
    .then(() => redis.rdel({
      args: ['test1', 'test2']
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
      
      t.equal(a, null);
      t.equal(b, null);
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('del: Deletes hashes', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rhset({
      hash_name: 'test1_random_hash',
      key_name : 'test1',
      data     : 'test1'
    }))
    .then(() => redis.rdel({
      args: ['test1_random_hash']
    }))
    .then(() => {
      
      return BPromise.map([
        () => redis.rhget({
          hash_name: 'test1_random_hash',
          key_name : 'test1'
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