module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  var ajv     = require("ajv")({
    removeAdditional: false
  });
  
  /**
   *
   * @param opts
   * @param {string} opts.hash_name
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @param {number} [opts.max_life_seconds]
   * @returns {*} // object
   */
  Redis_wrapper.prototype._hgetAll = function (opts) {
    var self         = this;
    var redis_client = self.redis_client;
    
    var schema = {
      type                : "object",
      properties          : {
        hash_name           : {
          type: 'string'
        },
        should_be_registered: {
          type: 'boolean'
        },
        max_life_seconds    : {
          type: 'integer'
        }
      },
      required            : ["hash_name", "should_be_registered"],
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
        
        if (self.validateKey(opts.hash_name)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        return redis_client.hgetallAsync(opts.hash_name)
          .then(function (d) {
            return d;
          });
      })
      .then(function (ob) {
        
        if (!ob) {
          // user gave a non existent hash_name
          ob = {};
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
              return self._hdel({
                  should_be_registered: true,
                  hash_name           : opts.hash_name,
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