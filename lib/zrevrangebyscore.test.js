const BPromise     = require('bluebird');
const tape         = require('tape');
const test_config  = require('../test');
const redis        = test_config.redis;
const shallowEqual = require('shallowequal');

tape('zrevrangebyscore: Gets keys correctly', function (t) {
  
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
    .then(() => redis.rzrevrangebyscore({
      set_name : 'set',
      min_score: -Infinity,
      max_score: Infinity
    }))
    .then(d => {
      
      t.true(shallowEqual(d, [3, 2, 1].map(d => String(d))));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('zrevrangebyscore: WithScores works', function (t) {
  
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
    .then(() => redis.rzrevrangebyscore({
      set_name   : 'set',
      min_score  : -Infinity,
      max_score  : Infinity,
      with_scores: true
    }))
    .then(d => {
      
      t.true(shallowEqual(d, [3, 3, 2, 2, 1, 1].map(d => String(d))));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('zrevrangebyscore: Limit Offset and Count works', function (t) {
  
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
    .then(() => redis.rzrevrangebyscore({
      set_name : 'set',
      min_score: -Infinity,
      max_score: Infinity,
      limit    : {
        count : 2,
        offset: 1
      }
    }))
    .then(d => {
      
      console.log(d);
      
      t.true(shallowEqual(d, [4, 3].map(d => String(d))));
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});