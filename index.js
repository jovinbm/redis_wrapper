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
 * @param {string} config.host
 * @param {number} config.port
 * @param {function} config.validateKey - function to validate the keys
 * @returns {*}
 */
var Redis_wrapper = function (config) {
  var self = this;
  
  var schema = {
    type                : 'object',
    additionalProperties: false,
    required            : ['host', 'port', 'db_number', 'validateKey'],
    properties          : {
      host       : {
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
  
  var valid = ajv.validate(schema, config);
  
  if (!valid) {
    var e = new Error(ajv.errorsText());
    e.ajv = ajv.errors;
    throw e;
  }
  
  if (typeof config.validateKey !== 'function') {
    throw new Error("config.validateKey is not a function");
  }
  
  var redis_client;
  redis_client = redis.createClient(config.port, config.host, {});
  
  redis_client.on("error", function (e) {
    throw e;
  });
  
  redis_client.on("ready", function () {
    redis_client.select(config.db_number, function (e) {
      console.info("SUCCESSFULLY CONNECTED TO REDIS DB " + config.db_number + " AT ADDRESS " + config.host + ":" + config.port);
      
      if (e) {
        console.error("FAILED TO CONNECT TO REDIS DB " + config.db_number);
        throw e;
      }
    });
  });
  
  self.name         = 'Redis_wrapper';
  self.host         = config.host;
  self.port         = config.port;
  self.db_number    = config.db_number;
  self.redis_client = redis_client;
  self.validateKey  = config.validateKey;
};

require('./lib/index')(Redis_wrapper);

exports.Redis_wrapper = Redis_wrapper;