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
 * @param {string} config.key_prefix
 * @param {object} [config.sentinel_options]
 * @param {string} [config.sentinel_options.name]
 * @param {object[]} [config.sentinel_options.sentinels]
 * @param {function} config.validateKey - function to validate the keys
 * @returns {*}
 */
var RedisWrapper = function (config) {
  var self = this;
  
  var schema = {
    definitions: {
      host       : {
        type     : 'string',
        minLength: 1
      },
      port       : {
        type   : 'integer',
        minimum: 80
      },
      db_number  : {
        type   : 'integer',
        maximum: 16
      },
      key_prefix : {
        type     : 'string',
        minLength: 1
      },
      validateKey: {}
    },
    oneOf      : [
      {
        type                : 'object',
        additionalProperties: false,
        required            : ['db_number', 'validateKey', 'sentinel_options'],
        properties          : {
          db_number       : {
            $ref: '#/definitions/db_number'
          },
          validateKey     : {
            $ref: '#/definitions/validateKey'
          },
          key_prefix      : {
            $ref: '#/definitions/key_prefix'
          },
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
                      $ref: '#/definitions/host'
                    },
                    port: {
                      $ref: '#/definitions/port'
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        type                : 'object',
        additionalProperties: false,
        required            : ['host', 'port', 'db_number', 'validateKey'],
        properties          : {
          host       : {
            $ref: '#/definitions/host'
          },
          port       : {
            $ref: '#/definitions/port'
          },
          db_number  : {
            $ref: '#/definitions/db_number'
          },
          key_prefix : {
            $ref: '#/definitions/key_prefix'
          },
          validateKey: {
            $ref: '#/definitions/validateKey'
          }
        }
      }
    ]
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
    
    const conf = {
      sentinels            : config.sentinel_options.sentinels,
      name                 : config.sentinel_options.name,
      db                   : config.db_number,
      retryStrategy        : function (options) {
        var error = options.error;
        console.error('A REDIS ERROR OCCURRED: RETRYING AFTER 10 seconds: ERROR = ', error);
        return 10000;
      },
      sentinelRetryStrategy: function (options) {
        var error = options.error;
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
        var error = options.error;
        console.error('A REDIS ERROR OCCURRED: RETRYING AFTER 10 seconds: ERROR = ', error);
        return 10000;
      }
    };
    
    if (config.key_prefix) {
      conf.keyPrefix = config.key_prefix;
    }
    
    client = new Redis(conf);
    
  }
  
  client.on("connect", function () {
    console.info('REDIS CLIENT CONNECTED TO SERVER');
  });
  
  client.on("ready", function () {
    console.info("REDIS CLIENT READY:: CONNECTED TO REDIS DB " + config.db_number);
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