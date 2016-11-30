const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('hscan: Scans and returns correct hash keys', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rhmset({
      hash_name: 'hash',
      args     : {
        match_1: '1',
        match_2: '2',
        match_3: '3',
        abc    : 'abc'
      }
    }))
    .then(() => redis.rhscan({
      hash_name    : 'hash',
      match_pattern: 'match*',
      count        : 10
    }))
    .then(d => {
      
      t.true(shallowEqual(d.data, {
        match_1: '1',
        match_2: '2',
        match_3: '3'
      }));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});