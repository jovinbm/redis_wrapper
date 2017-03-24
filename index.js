const Redis          = require('ioredis');
const ajv            = require('ajv')({
  removeAdditional: false
});
const config_schema  = require('./config_schema');
const configValidate = ajv.compile(config_schema);

/**
 *
 * @param {object} config
 * @param {number} config.db_number
 * @param {string} config.host
 * @param {number} config.port
 * @param {string} [config.password]
 * @param {string} [config.key_prefix]
 * @param {object} [config.sentinel_options]
 * @param {string} [config.sentinel_options.name]
 * @param {object[]} [config.sentinel_options.sentinels]
 * @param {function} config.validateKey - function to validate the keys
 * @returns {*}
 */
const RedisWrapper = function (config) {
  const self = this;
  
  const valid = configValidate(config);
  
  if (!valid) {
    const e = new Error(ajv.errorsText());
    
    e.ajv = ajv.errors;
    throw e;
  }
  
  if (typeof config.validateKey !== 'function') {
    throw new Error('config.validateKey is not a function');
  }
  
  let client;
  
  if (config.sentinel_options) {
    
    console.info('REDIS CLIENT INITIATING WITH SENTINEL SUPPORT');
    
    const conf = {
      sentinels            : config.sentinel_options.sentinels,
      name                 : config.sentinel_options.name,
      db                   : config.db_number,
      retryStrategy        : function (options) {
        const error = options.error;
        
        console.error('A REDIS ERROR OCCURRED: RETRYING AFTER 10 seconds: ERROR = ', error);
        
        return 10000;
      },
      sentinelRetryStrategy: function (options) {
        const error = options.error;
        
        console.error('A REDIS ERROR OCCURRED: SENTINELS ARE UNREACHABLE: RETRYING AFTER 30 seconds: ERROR = ', error);
        
        return 30000;
      }
    };
    
    if (config.key_prefix) {
      conf.keyPrefix = config.key_prefix;
    }
    
    client = new Redis(conf);
    
  }
  else {
    
    const conf = {
      host         : config.host,
      port         : config.port,
      db           : config.db_number,
      retryStrategy: function (options) {
        const error = options.error;
        
        console.error('A REDIS ERROR OCCURRED: RETRYING AFTER 10 seconds: ERROR = ', error);
        
        return 10000;
      }
    };
    
    if (config.password) {
      conf.password = config.password;
    }
    
    if (config.key_prefix) {
      conf.keyPrefix = config.key_prefix;
    }
    
    client = new Redis(conf);
    
  }
  
  client.on('connect', () => {
    console.info('REDIS CLIENT CONNECTED TO SERVER');
  });
  
  client.on('ready', () => {
    console.info(`REDIS CLIENT READY:: CONNECTED TO REDIS DB ${config.db_number}`);
  });
  
  client.on('reconnecting', () => {
    console.warn('REDIS CLIENT RECONNECTING');
  });
  
  client.on('error', (e) => {
    console.error('REDIS CLIENT ERROR');
    console.error(e);
  });
  
  client.on('end', () => {
    console.error('REDIS CLIENT CONNECTION TO REDIS SERVER CLOSED');
  });
  
  self.name        = 'RedisWrapper';
  self.host        = config.host;
  self.port        = config.port;
  self.db_number   = config.db_number;
  self.client      = client;
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