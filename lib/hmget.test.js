const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('hmget: Returns object with nullified keys for non-existing hash', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rflushdb())
    .then(() => redis.rhmget({
      hash_name: 'hash',
      key_names: ['1', '2']
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {
        1: null,
        2: null
      }));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('hmget: Gets all hash keys, set null for non-existent fields', function (t) {
  
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
    .then(() => redis.rhmget({
      hash_name: 'hash',
      key_names: ['1', '2', '3', '4']
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {
        1: '1',
        2: '2',
        3: '3',
        4: null
      }));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});