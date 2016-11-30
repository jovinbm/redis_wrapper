const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('hget: Returns empty object for non-existing hash', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rflushdb())
    .then(() => redis.rhgetall({
      hash_name: 'hash'
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {}));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('hget: Gets all hash keys', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rhmset({
      hash_name: 'hash',
      args     : {
        1: '1',
        2: '2',
        3: '3'
      }
    }))
    .then(() => redis.rhgetall({
      hash_name: 'hash'
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {
        1: '1',
        2: '2',
        3: '3'
      }));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});