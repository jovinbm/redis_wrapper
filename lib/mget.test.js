const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('mget: Returns object with nullified keys for non-existing key_names', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rflushdb())
    .then(() => redis.rmget({
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

tape('mget: Gets all keys, sets null for non-existent fields', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rmset({
      args: {
        1: '1',
        2: '2',
        3: '3'
      }
    }))
    .then(() => redis.rmget({
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