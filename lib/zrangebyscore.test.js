const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('zrangebyscore: Gets keys correctly', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rzadd({
      set_name: 'set',
      args    : {
        1: 1,
        2: 2,
        3: 3,
        4: 4
      }
    }))
    .then(() => redis.rzrangebyscore({
      set_name : 'set',
      min_score: -Infinity,
      max_score: Infinity
    }))
    .then(d => {
      
      t.true(shallowEqual(d, [1, 2, 3, 4].map(d => String(d))));
      
    })
    .then(() => redis.rzrangebyscore({
      set_name : 'set',
      min_score: 2,
      max_score: 3
    }))
    .then(d => {
      
      t.true(shallowEqual(d, [2, 3].map(d => String(d))));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('zrangebyscore: WithScores works', function (t) {
  
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
    .then(() => redis.rzrangebyscore({
      set_name   : 'set',
      min_score  : -Infinity,
      max_score  : Infinity,
      with_scores: true
    }))
    .then(d => {
      
      t.true(shallowEqual(d, [1, 1, 2, 2, 3, 3].map(d => String(d))));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('zrangebyscore: Limit Offset and Count works', function (t) {
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rzadd({
      set_name: 'set',
      args    : {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5
      }
    }))
    .then(() => redis.rzrangebyscore({
      set_name : 'set',
      min_score: -Infinity,
      max_score: Infinity,
      limit    : {
        count : 2,
        offset: 1
      }
    }))
    .then(d => {
      
      t.true(shallowEqual(d, [2, 3].map(d => String(d))));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});