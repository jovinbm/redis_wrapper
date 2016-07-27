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
    key_names           : {
      type    : 'array',
      minItems: 1,
      items   : {
        type     : 'string',
        minLength: 1
      }
    },
    should_be_registered: {
      type: 'boolean'
    },
    max_life_seconds    : {
      type: 'integer'
    }
  },
  required            : ["hash_name", "key_names", "should_be_registered"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (RedisWrapper) {
  
  /**
   * Returns the values associated with the specified fields in the hash stored at key
   * @param opts
   * @param {string} opts.hash_name
   * @param {object[]} opts.key_names - an array of key_names to be retrieved
   * @param {boolean} opts.should_be_registered - if the hash should be registered in global registered keys
   * @returns {*} // object {key: value, key: value, key: value}
   */
  RedisWrapper.prototype._hmget = function (opts) {
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
        return redis_client.hmgetAsync(opts.hash_name, opts.key_names)
          .then(function (d) {
            return d;
          });
      })
      .then(function (d) {
        
        if (!d) {
          // user gave a non existent hash_name
          d = [];
        }
        
        var final_object = {};
        
        // if a field does not exist, according to redis, it is set to (nil), but node_redis sets it to null
        return BPromise.map(d, function (d, i) {
          
          if (!d) {
            final_object[opts.key_names[i]] = null;
          }
          else {
            final_object[opts.key_names[i]] = d;
          }
          
          return true;
        }, {concurrency: 50})
          .then(function () {
            return final_object;
          });
      });
  };
};