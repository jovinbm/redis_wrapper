const BPromise    = require('bluebird');
const tape        = require('tape');
const test_config = require('../test');
const redis       = test_config.redis;

tape('exists: Correctly Identifies existing keys', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rmset({
      args: {
        test_1: 'test_1',
        test_2: 'test_2'
      }
    }))
    .then(() => redis.rhmset({
      hash_name: 'test_hash_1',
      args     : {
        test_1: 'test_1',
        name  : 'test_1'
      }
    }))
    .then(() => redis.rexists({
      key_names: ['test_1', 'test_2', 'test_hash_1']
    }))
    .then(d => t.equal(d, 3, 'Correct number of keys'))
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('exists: Returns 0 for non-existent', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rflushdb())
    .then(() => redis.rexists({
      key_names: ['test_1', 'test_2', 'test_hash_1']
    }))
    .then(d => t.equal(d, 0, 'Correct number of keys'))
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});