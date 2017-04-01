const Redis = require('ioredis');

/**
 *
 * @param {object} config
 * @param {function} config.validateKey - function to validate the keys
 * @returns {*}
 */
const RedisWrapper = function (config) {
  const self = this;
  
  if (typeof config.validateKey !== 'function') {
    throw new Error('config.validateKey must be a function');
  }
  
  self.client      = new Redis(config);
  self.validateKey = config.validateKey;
  
  self.bins = {
    hash_keys_expire: 'bin:set_hash_keys_expire'
  };
  
  return self;
};

RedisWrapper.prototype.rdel                               = require('./lib/del');
RedisWrapper.prototype.rexists                            = require('./lib/exists');
RedisWrapper.prototype.rflushdb                           = require('./lib/flushdb');
RedisWrapper.prototype.rget                               = require('./lib/get');
RedisWrapper.prototype.rhdel                              = require('./lib/hdel');
RedisWrapper.prototype.rhexists                           = require('./lib/hexists');
RedisWrapper.prototype.rhget                              = require('./lib/hget');
RedisWrapper.prototype.rhgetall                           = require('./lib/hgetall');
RedisWrapper.prototype.rhmget                             = require('./lib/hmget');
RedisWrapper.prototype.rhmset                             = require('./lib/hmset');
RedisWrapper.prototype.rhscan                             = require('./lib/hscan');
RedisWrapper.prototype.rhset                              = require('./lib/hset');
RedisWrapper.prototype.rmget                              = require('./lib/mget');
RedisWrapper.prototype.rmset                              = require('./lib/mset');
RedisWrapper.prototype.rset                               = require('./lib/set');
RedisWrapper.prototype.rzadd                              = require('./lib/zadd');
RedisWrapper.prototype.rzincrby                           = require('./lib/zincrby');
RedisWrapper.prototype.rzrange                            = require('./lib/zrange');
RedisWrapper.prototype.rzrangebyscore                     = require('./lib/zrangebyscore');
RedisWrapper.prototype.rzrem                              = require('./lib/zrem');
RedisWrapper.prototype.rzremrangebyscore                  = require('./lib/zremrangebyscore');
RedisWrapper.prototype.rzrevrange                         = require('./lib/zrevrange');
RedisWrapper.prototype.rzrevrangebyscore                  = require('./lib/zrevrangebyscore');
//expire helpers
RedisWrapper.prototype.prepareHashKeyExpireRepresentative = require('./lib/hash_key_expire').prepareHashKeyExpireRepresentative;
RedisWrapper.prototype.removeExpiredHashKeys              = require('./lib/hash_key_expire').removeExpiredHashKeys;

module.exports = RedisWrapper;