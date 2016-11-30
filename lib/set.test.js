const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('set: Sets keys correctly', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rset({
      key_name: '1',
      data    : '1'
    }))
    .then(() => redis.rmget({
      key_names: ['1']
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {
        1: '1'
      }));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('set: Overwrite works correctly', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rset({
      key_name: '1',
      data    : '1'
    }))
    .then(() => redis.rset({
      key_name: '1',
      data    : '2'
    }))
    .then(() => redis.rmget({
      key_names: ['1']
    }))
    .then(d => {
      
      t.true(shallowEqual(d, {
        1: '2'
      }), 'Overwrites by default');
      
    })
    .then(() => redis.rset({
      key_name: '2',
      data    : '1'
    }))
    .then(() => redis.rset({
      key_name : '2',
      data     : '2',
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

tape('set: Sets expiring keys', function (t) {
  
  const key_name         = '1';
  const max_life_seconds = 2;
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rset({
      key_name: '1',
      data    : '1',
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