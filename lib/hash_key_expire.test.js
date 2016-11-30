const BPromise                           = require('bluebird');
const tape                               = require('tape');
const test_config                        = require('../test');
const redis                              = test_config.redis;
const prepareHashKeyExpireRepresentative = redis.prepareHashKeyExpireRepresentative;
const removeExpiredHashKeys              = redis.removeExpiredHashKeys;
const getRepresentativeName              = require('./hash_key_expire').getRepresentativeName;

tape('hash_key_expire: Prepares the expire representative', function (t) {
  
  const hash_name        = 'test_hash_1';
  const key_name         = 'test_key_1';
  const max_life_seconds = 2;
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rflushdb())
    .then(() => redis.rhset({
      hash_name: hash_name,
      key_name : key_name,
      data     : 'test1'
    }))
    .then(() => prepareHashKeyExpireRepresentative.call(redis, {
      hash_name,
      key_names: [key_name],
      max_life_seconds
    }))
    .then(commands => redis.client.multi(commands).exec())
    .then(() => redis.rzrange({
      set_name   : redis.bins.hash_keys_expire,
      start_index: 0,
      stop_index : -1,
      with_scores: true
    }))
    .then(a => {
      
      t.true(a, 'Returns truthy value');
      t.equal(a[0], getRepresentativeName(hash_name, key_name), 'correct name');
      t.true((Date.now() + (max_life_seconds * 1000) - a[1]) <= 5, 'correct score');
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('hash_key_expire: Does not remove unexpired representative and the hash key', function (t) {
  
  const hash_name        = 'test_hash_1';
  const key_name         = 'test_key_1';
  const max_life_seconds = 10;
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rflushdb())
    .then(() => redis.rhset({
      hash_name: hash_name,
      key_name : key_name,
      data     : 'test1'
    }))
    .then(() => prepareHashKeyExpireRepresentative.call(redis, {
      hash_name,
      key_names: [key_name],
      max_life_seconds
    }))
    .then(commands => redis.client.multi(commands).exec())
    .then(() => removeExpiredHashKeys.call(redis))
    .then(() => redis.rexists({
      key_names: [hash_name]
    }))
    .then(d => t.equal(d, 1, 'hash still exists'))
    .then(() => redis.rhexists({
      hash_name: hash_name,
      key_name : key_name
    }))
    .then(d => t.equal(d, 1, 'hash key still exists'))
    .then(() => redis.rzrange({
      set_name   : redis.bins.hash_keys_expire,
      start_index: 0,
      stop_index : -1,
      with_scores: true
    }))
    .then(a => {
      
      t.true(a, 'Set key representative still exists');
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});

tape('hash_key_expire: Removes expired representative and the hash key', function (t) {
  
  const hash_name        = 'test_hash_1';
  const key_name         = 'test_key_1';
  const max_life_seconds = 1;
  
  return BPromise.resolve()
    .then(test_config.downUp)
    .then(() => redis.rflushdb())
    .then(() => redis.rhmset({
      hash_name: hash_name,
      args     : {
        [key_name]: 'test_1',
        name      : 'test_1'
      }
    }))
    .then(() => prepareHashKeyExpireRepresentative.call(redis, {
      hash_name,
      key_names: [key_name],
      max_life_seconds
    }))
    .then(commands => redis.client.multi(commands).exec())
    .delay((max_life_seconds + 1) * 1000)
    .then(() => removeExpiredHashKeys.call(redis))
    .then(() => redis.rexists({
      key_names: [hash_name]
    }))
    .then(d => t.equal(d, 1, 'hash still exists'))
    .then(() => redis.rhexists({
      hash_name: hash_name,
      key_name : key_name
    }))
    .then(d => t.equal(d, 0, 'hash key deleted'))
    .then(() => redis.rzrange({
      set_name   : redis.bins.hash_keys_expire,
      start_index: 0,
      stop_index : -1,
      with_scores: true
    }))
    .then(a => {
      
      t.equal(a.length, 0, 'Set key removed');
      
    })
    .then(test_config.down)
    .then(() => t.end())
    .catch(t.end);
  
});