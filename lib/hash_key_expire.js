var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: false
});

function getRepresentativeName(hash_name, key_name) {
  return `START_HASH_KEY_EXPIRE_REPRESENTATIVE::${hash_name}<<<>>>${key_name}::END_HASH_KEY_EXPIRE_REPRESENTATIVE`;
}

function getHashNameFromRepresentative(key) {
  var hash_name = null;
  
  try {
    hash_name = key.split('START_HASH_KEY_EXPIRE_REPRESENTATIVE::')[1].split('::END_HASH_KEY_EXPIRE_REPRESENTATIVE')[0].split('<<<>>>')[0];
  }
  catch (e) {
    console.error(e.stack);
  }
  
  return hash_name;
}

function getKeyNameFromRepresentative(key) {
  var key_name = null;
  
  try {
    key_name = key.split('START_HASH_KEY_EXPIRE_REPRESENTATIVE::')[1].split('::END_HASH_KEY_EXPIRE_REPRESENTATIVE')[0].split('<<<>>>')[1];
  }
  catch (e) {
    console.error(e.stack);
  }
  
  return key_name;
}

module.exports = function (RedisWrapper) {
  
  /**
   *
   * @param opts
   * @param {string} opts.hash_name
   * @param {object[]} opts.key_names - key_names [jovin, jesus, mwilanga]
   * @param {number} opts.max_life_seconds
   * @returns {Promise.<object[]>}  - an array of zadd commands
   */
  RedisWrapper.prototype.prepareHashKeyExpireRepresentative = function (opts) {
    var self = this;
    
    var schema = {
      type                : "object",
      required            : ["hash_name", "key_names", "max_life_seconds"],
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
        return BPromise.map(opts.key_names, function (key_name) {
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