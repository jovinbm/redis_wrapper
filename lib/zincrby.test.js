const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('zincrby: Increments set key scores', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rzadd({
      set_name: 'set',
      args    : {
        1: 1
      }
    }))
    .then(() => redis.rzincrby({
      set_name: 'set',
      args    : {
        1: 1
      }
    }))
    .then(() => redis.rzrange({
      set_name   : 'set',
      start_index: 0,
      stop_index : -1,
      with_scores: true
    }))
    .then(d => {
      
      t.true(shallowEqual(d, [1, 2].map(d => String(d))));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('zincrby: Adds key if not exists', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rzincrby({
      set_name: 'set',
      args    : {
        3: 1
      }
    }))
    .then(() => redis.rzrange({
      set_name   : 'set',
      start_index: 0,
      stop_index : -1,
      with_scores: true
    }))
    .then(d => {
      
      t.true(shallowEqual(d, [3, 1].map(d => String(d))));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});