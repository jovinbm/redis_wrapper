module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  var ajv     = require("ajv")({
    removeAdditional: false
  });
  
  /**
   *
   * @param opts
   * @param {string} opts.hashName
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @param {number} [opts.max_life_seconds]
   * @returns {*} // object
   */
  Redis_wrapper.prototype._hgetAll = function (opts) {
    var redis_client = Redis_wrapper.redis_client;
    
    var schema = {
      type                : "object",
      properties          : {
        hashName            : {
          type: 'string'
        },
        should_be_registered: {
          type: 'boolean'
        },
        max_life_seconds    : {
          type: 'integer'
        }
      },
      required            : ["hashName", "should_be_registered"],
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
        return redis_client.hgetallAsync(opts.hashName)
          .then(function (d) {
            return d;
          });
      })
      .then(function (ob) {
        
        if (!ob) {
          // user gave a non existent hash_name
          return null;
        }
        
        var final_object = {};
        
        return Promise.map(Object.keys(ob), function (key_name) {
            
            var d = ob[key_name];
            
            if (!d) {
              final_object[key_name] = null;
              return true;
            }
            
            var stored_value = JSON.parse(d);
            
            if (!opts.max_life_seconds) {
              final_object[key_name] = stored_value.data;
              return true;
            }
            
            if ((Date.now() - stored_value.created_at) / 1000 > opts.max_life_seconds) {
              // remove it
              return (new Redis_wrapper())._hdel({
                  should_be_registered: true,
                  hashName            : opts.hashName,
                  args                : [key_name]
                })
                .then(function () {
                  final_object[key_name] = null;
                  return true;
                });
              
            }
            
            final_object[key_name] = stored_value.data;
            return true;
            
          }, {concurrency: 50})
          .then(function () {
            return final_object;
          });
      });
  };
};