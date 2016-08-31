var Redis = require('ioredis');
var ajv   = require("ajv")({
  removeAdditional: false
});

/**
 *
 * @param {object} config
 * @param {number} config.db_number
 * @param {string} config.host
 * @param {number} config.port
 * @param {object} [config.sentinel_options]
 * @param {string} [config.sentinel_options.name]
 * @param {object[]} [config.sentinel_options.sentinels]
 * @param {function} config.validateKey - function to validate the keys
 * @returns {*}
 */
var RedisWrapper = function (config) {
  var self = this;
  
  var schema = {
    type                : 'object',
    additionalProperties: false,
    required            : ['host', 'port', 'db_number', 'validateKey'],
    properties          : {
      sentinel_options: {
        type                : 'object',
        required            : ['name', 'sentinels'],
        additionalProperties: false,
        properties          : {
          name     : {
            type     : 'string',
            minLength: 1
          },
          sentinels: {
            type    : 'array',
            minItems: 1,
            items   : {
              type                : 'object',
              required            : ['host', 'port'],
              additionalProperties: false,
              properties          : {
                host: {
                  type     : 'string',
                  minLength: 1
                },
                port: {
                  type   : 'integer',
                  minimum: 80
                },
              }
            }
          },
        }
      },
      host            : {
        type     : 'string',
        minLength: 1
      },
      port            : {
        type   : 'integer',
        minimum: 80
      },
      db_number       : {
        type: 'integer'
      },
      validateKey     : {}
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
  
  var client;
  
  if (config.sentinel_options) {
    
    console.info('REDIS CLIENT INITIATING WITH SENTINEL SUPPORT');
    
    client = new Redis({
      sentinels     : config.sentinel_options.sentinels,
      name          : config.sentinel_options.name,
      db            : config.db_number,
      retry_strategy: function (options) {
        var error = options.error;
        console.error('A REDIS ERROR OCCURRED: RETRYING AFTER 5 seconds: ERROR = ', error);
        return 5000;
      }
    });
    
  }
  else {
    
    client = new Redis({
      host          : config.host,
      port          : config.port,
      db            : config.db_number,
      retry_strategy: function (options) {
        var error = options.error;
        console.error('A REDIS ERROR OCCURRED: RETRYING AFTER 5 seconds: ERROR = ', error);
        return 5000;
      }
    });
    
  }
  
  client.on("connect", function () {
    console.info('REDIS CLIENT CONNECTED TO SERVER');
  });
  
  client.on("ready", function () {
    console.info("REDIS CLIENT READY:: CONNECTED TO REDIS DB " + config.db_number + " AT ADDRESS " + config.host + ":" + config.port);
  });
  
  client.on("reconnecting", function () {
    console.warn('REDIS CLIENT RECONNECTING');
  });
  
  client.on("error", function (e) {
    console.error('REDIS CLIENT ERROR');
    console.error(e);
  });
  
  client.on("end", function () {
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

require('./lib/index')(RedisWrapper);

module.exports = RedisWrapper;