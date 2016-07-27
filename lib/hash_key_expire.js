var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: false
});

function getRepresentativeName(hash_name, key_name) {
  return `${hash_name}_${key_name}`;
}

function getHashNameFromRepresentative(key) {
  return key.split('_')[0];
}

function getKeyNameFromRepresentative(key) {
  return key.split('_')[1];
}

module.exports = function (RedisWrapper) {
  
  /**
   *
   * @param opts
   * @param {string} opts.hash_name
   * @param {object[]} opts.args - key_names [jovin, jesus, mwilanga]
   * @param {number} opts.max_life_seconds
   * @returns {Promise.<object[]>}  - an array of zadd commands
   */
  RedisWrapper.prototype.setHashKeyExpireRepresentative = function (opts) {
    var self = this;
    
    var schema = {
      type                : "object",
      required            : ["hash_name", "key_name", "max_life_seconds"],
      additionalProperties: false,
      properties          : {
        hash_name       : {
          type: 'string'
        },
        key_names       : {
          type    : 'array',
          minItems: 1,
          items   : {
            type: 'string'
          }
        },
        max_life_seconds: {
          type: 'integer'
        }
      }
    };
    
    var validate = ajv.compile(schema);
    var valid    = validate(opts);
    
    if (!valid) {
      var e = new Error(ajv.errorsText(validate.errors));
      e.ajv = validate.errors;
      throw e;
    }
    
    var score         = Date.now() + (opts.max_life_seconds * 1000);
    var zadd_commands = [];
    
    return BPromise.resolve()
      .then(function () {
        return BPromise.map(opts.args, function (key_name) {
          var command = [
            'zadd',
            self.bins.hash_keys_expire,
            score,
            getRepresentativeName(opts.hash_name, key_name)
          ];
          
          zadd_commands.push(command);
          return true;
        });
      })
      .then(function () {
        return zadd_commands;
      });
  };
  
  RedisWrapper.prototype.removeExpiredHashKeys = function () {
    var self         = this;
    var redis_client = self.redis_client;
    
    var now = Date.now();
    
    return BPromise.resolve()
      .then(function () {
        
        var expired_keys   = [];
        var multi_commands = [];
        
        return self._zrangebyscore({
          set_name            : self.bins.hash_keys_expire,
          min_score           : 0,
          max_score           : now,
          should_be_registered: false
        })
          .then(function (d) {
            if (!d || d.length === 0) {
              return true;
            }
            
            expired_keys = d;
            
            return BPromise.map(expired_keys, function (k) {
              
              var hash_name = getHashNameFromRepresentative(k);
              var key_name  = getKeyNameFromRepresentative(k);
              
              if (!hash_name || !key_name) {
                return true;
              }
              
              multi_commands.push([
                'hdel',
                hash_name,
                key_name
              ]);
            });
            
          })
          .then(function () {
            
            return BPromise.map(expired_keys, function (arg) {
              
              multi_commands.push([
                'zrem',
                self.bins.hash_keys_expire,
                arg // name
              ]);
              
              return true;
              
            });
          })
          .then(function () {
            // execute
            return redis_client.multi(multi_commands)
              .execAsync();
          });
      });
  };
};