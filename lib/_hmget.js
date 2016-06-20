module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  var ajv     = require("ajv")({
    removeAdditional: false
  });
  
  /**
   *
   * @param opts
   * @param {string} opts.hashName
   * @param {object[]} opts.key_names - an array of key_names to be retrieved
   * @param {boolean} opts.should_be_registered - if the hash should be registered in global registered keys
   * @param {number} [opts.max_life_seconds]
   * @returns {*}
   */
  Redis_wrapper.prototype._hmget = function (opts) {
    var redis_client = Redis_wrapper.redis_client;
    
    var schema = {
      type                : "object",
      properties          : {
        hashName            : {
          type: 'string'
        },
        key_names            : {
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
      required            : ["hashName", "key_names", "should_be_registered"],
      additionalProperties: false
    };
    
    var valid = ajv.validate(schema, opts);
    
    if (!valid) {
      var e = new Error(ajv.errorsText());
      e.ajv = ajv.errors;
      throw e;
    }
    
    return Promise.resolve()
      .then(function () {
        
        if (!opts.should_be_registered) {
          return true;
        }
        
        if (Redis_wrapper.validateKey(opts.hashName)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        return redis_client.hmgetAsync(opts.hashName, opts.key_names)
          .then(function (d) {
            return d;
          });
      })
      .then(function (d) {
        
        if (!d) {
          // user gave a non existent hash_name
          return null;
        }
        
        var final_object = {};
        
        // if a field does not exist, according to redis, it is set to (nil), but node_redis sets it to null
        return Promise.map(d, function (d, i) {
            
            if (!d) {
              final_object[opts.key_names[i]] = null;
              return true;
            }
            
            var stored_value = JSON.parse(d);
            
            if (!opts.max_life_seconds) {
              final_object[opts.key_names[i]] = stored_value.data;
              return true;
            }
            
            if ((Date.now() - stored_value.created_at) / 1000 > opts.max_life_seconds) {
              // remove it
              return (new Redis_wrapper())._hdel({
                  should_be_registered: true,
                  hashName            : opts.hashName,
                  args                : [opts.key_names[i]]
                })
                .then(function () {
                  final_object[opts.key_names[i]] = null;
                  return true;
                });
            }
            
            final_object[opts.key_names[i]] = stored_value.data;
            return true;
          })
          .then(function () {
            return final_object; // keys are the original requested key names, vales are the field values 
          });
      });
  };
};