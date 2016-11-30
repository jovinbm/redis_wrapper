const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('hmset: Sets keys correctly', function (t) {
  
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
      key_names: ['1', '2', '3']
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

tape('hmset: Overwrite works correctly', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rhmset({
      hash_name: 'hash',
      args     : {
        1: '1'
      }
    }))
    .then(() => redis.rhmset({
      hash_name: 'hash',
      args     : {
        1: '2'
      }
    }))
    .then(() => redis.rhmget({
      hash_name: 'hash',
      key_names: ['1']
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {
        1: '2'
      }), 'Overwrites by default');
      
    })
    .then(() => redis.rhmset({
      hash_name: 'hash',
      args     : {
        2: '1'
      }
    }))
    .then(() => redis.rhmset({
      hash_name: 'hash',
      args     : {
        2: '2'
      },
      overwrite: false
    }))
    .then(() => redis.rhmget({
      hash_name: 'hash',
      key_names: ['2']
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {
        2: '1'
      }), 'Does not overwrite');
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('hmset: Sets expiring hash keys', function (t) {
  
  const hash_name        = '1';
  const key_name         = '1';
  const max_life_seconds = 2;
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rhmset({
      hash_name: 'hash',
      args     : {
        [hash_name]: '1'
      },
      max_life_seconds
    }))
    .delay(max_life_seconds * 1000)
    .then(() => redis.removeExpiredHashKeys())
    .then(() => redis.rhmget({
      hash_name,
      key_names: [key_name]
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {
        [hash_name]: null
      }), 'hash key was removed');
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});