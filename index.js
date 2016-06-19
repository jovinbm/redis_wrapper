var Promise = require('bluebird');
var redis   = require('redis');
var ajv     = require("ajv")({
  removeAdditional: false
});
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

/**
 *
 * @param {object} config
 * @param {number} config.db_number
 * @param {string} config.redis_uri
 * @param {number} config.port
 * @param {function} config.validateKey - function to validate the keys
 * @returns {*}
 */
exports.Redis_wrapper = function (config) {
  
  var schema = {
    type                : 'object',
    additionalProperties: false,
    required            : ['redis_uri', 'port', 'db_number', 'validateKey'],
    properties          : {
      redis_uri  : {
        type     : 'string',
        minLength: 1
      },
      port       : {
        type   : 'integer',
        minimum: 80
      },
      db_number  : {
        type: 'integer'
      },
      validateKey: {}
    }
  };
  
  var valid = ajv.validate(schema, event);
  
  if (!valid) {
    var e = new Error(ajv.errorsText());
    e.ajv = ajv.errors;
    throw e;
  }
  
  if (typeof config.validateKey !== 'function') {
    throw new Error("config.validateKey is not a function");
  }
  
  var redis_client;
  redis_client = redis.createClient(config.port, config.redis_uri, {});
  
  redis_client.on("error", function (e) {
    throw e;
  });
  
  redis_client.on("ready", function () {
    redis_client.select(config.db_number, function (e) {
      console.info("SUCCESSFULLY CONNECTED TO REDIS DB " + config.db_number + " AT ADDRESS " + config.redis_uri + ":" + config.port);
      
      if (e) {
        console.error("FAILED TO CONNECT TO REDIS DB " + config.db_number);
        throw e;
      }
    });
  });
  
  var Redis_wrapper = function () {
    var self          = this;
    self.name         = 'Redis_wrapper';
    self.redis_url    = config.redis_uri;
    self.port         = config.port;
    self.db_number    = config.db_number;
    self.redis_client = redis_client;
    self.validateKey  = config.validateKey;
  };
  
  require('./lib/index')(Redis_wrapper);
  
  return new Redis_wrapper();
};