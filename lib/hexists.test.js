const BPromise    = require('bluebird');
const tape        = require('tape');
const test_config = require('../test');
const redis       = test_config.redis;

tape('hexists: Correctly Identifies existing keys', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rhmset({
      hash_name: 'test_hash_1',
      args     : {
        test_1: 'test_1',
        name  : 'test_1'
      }
    }))
    .then(() => redis.rhexists({
      hash_name: 'test_hash_1',
      key_name : 'test_1'
    }))
    .then(d => t.equal(d, 1, 'Correct'))
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('hexists: Returns 0 for non-existent', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rflushdb())
    .then(() => redis.rhexists({
      hash_name: 'test_hash_1',
      key_name : 'test_1'
    }))
    .then(d => t.equal(d, 0, 'Correct number'))
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});