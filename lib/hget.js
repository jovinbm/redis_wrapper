var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: false
});

var schema = {
  type                : "object",
  properties          : {
    hash_name           : {
      type: 'string'
    },
    key_name            : {
      type: 'string'
    },
    should_be_registered: {
      type: 'boolean'
    }
  },
  required            : ["hash_name", "key_name", "should_be_registered"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (RedisWrapper) {
  
  /**
   * Returns the value associated with field in the hash stored at key.
   * @param opts
   * @param {string} opts.hash_name
   * @param {string} opts.key_name
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @returns {*}
   */
  RedisWrapper.prototype._hget = function (opts) {
    var self         = this;
    var redis_client = self.redis_client;
    
    var valid = validate(opts);
    
    if (!valid) {
      var e = new Error(ajv.errorsText(validate.errors));
      e.ajv = validate.errors;
      throw e;
    }
    
    return BPromise.resolve()
      .then(function () {
        
        if (!opts.should_be_registered) {
          return true;
        }
        
        if (self.validateKey(opts.hash_name)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        //get the hash key
        return redis_client.hgetAsync(opts.hash_name, opts.key_name)
          .then(function (d) {
            
            if (d) {
              return d;
            }
            else {
              return null;
            }
          });
      });
  };
};