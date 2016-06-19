module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  var ajv     = require("ajv")({
    removeAdditional: false
  });
  
  /**
   *
   * @param {object} opts
   * @param {number} [opts.max_life_seconds]
   * @param {boolean} opts.should_be_registered - if every key should be registered in global registered keys
   * @param {object} opts.args e.g {key: val, key: val}
   * @returns {*}
   */
  Redis_wrapper.prototype._set = function (opts) {
    var redis_client = Redis_wrapper.redis_client;
    
    var schema = {
      type                : "object",
      properties          : {
        should_be_registered: {
          type: 'boolean'
        },
        args                : {
          type: "object"
        },
        max_life_seconds    : {
          type: 'integer'
        }
      },
      required            : ["args", "should_be_registered"],
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
        
        return Promise.map(Object.keys(opts.args), function (key) {
          if (Redis_wrapper.validateKey(key)) {
            return true;
          }
          else {
            throw new Error('Validate key failed');
          }
        });
      })
      .then(function () {
        var multi = [];
        
        return Promise.map(Object.keys(opts.args), function (key) {
            
            if (opts.max_life_seconds) {
              
              multi.push([
                'setex',
                key,
                opts.max_life_seconds,
                JSON.stringify(opts.args[key])
              ]);
              
            }
            else {
              
              multi.push([
                'set',
                key,
                JSON.stringify(opts.args[key])
              ]);
              
            }
            
            return true;
            
          })
          .then(function () {
            return redis_client.multi(multi)
              .execAsync();
          });
      });
  };
};