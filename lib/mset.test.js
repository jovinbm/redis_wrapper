const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('mset: Sets keys correctly', function (t) {
  
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

tape('mset: Overwrite works correctly', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rmset({
      args: {
        1: '1'
      }
    }))
    .then(() => redis.rmset({
      args: {
        1: '2'
      }
    }))
    .then(() => redis.rmget({
      key_names: ['1']
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {
        1: '2'
      }), 'Overwrites by default');
      
    })
    .then(() => redis.rmset({
      args: {
        2: '1'
      }
    }))
    .then(() => redis.rmset({
      args     : {
        2: '2'
      },
      overwrite: false
    }))
    .then(() => redis.rmget({
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

tape('mset: Sets expiring keys', function (t) {
  
  const key_name         = '1';
  const max_life_seconds = 2;
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rmset({
      args: {
        [key_name]: '1'
      },
      max_life_seconds
    }))
    .delay(max_life_seconds * 1000)
    .then(() => redis.rmget({
      key_names: [key_name]
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {
        [key_name]: null
      }), 'key was removed');
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});