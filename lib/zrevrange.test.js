const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('zrevrange: Gets keys correctly', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rzadd({
      set_name: 'set',
      args    : {
        1: 1,
        2: 2,
        3: 3
      }
    }))
    .then(() => redis.rzrevrange({
      set_name   : 'set',
      start_index: 0,
      stop_index : -1
    }))
    .then(d => {
      
      t.true(shallowEqual(d, [3, 2, 1].map(d => String(d))));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('zrevrange: WithScores works', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rzadd({
      set_name: 'set',
      args    : {
        1: 1,
        2: 2,
        3: 3
      }
    }))
    .then(() => redis.rzrevrange({
      set_name   : 'set',
      start_index: 0,
      stop_index : -1,
      with_scores: true
    }))
    .then(d => {
      
      t.true(shallowEqual(d, [3, 3, 2, 2, 1, 1].map(d => String(d))));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});