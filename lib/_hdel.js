module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  var ajv     = require("ajv")({
    removeAdditional: false
  });
  
  /**
   *
   * @param {object} opts
   * @param {string} opts.hashName
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @param {object[]} opts.args e.g ['jesus', 'jovin'] i.e. [name, name, ...]
   * @returns {*}
   */
  Redis_wrapper.prototype._hdel = function (opts) {
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
        args                : {
          type    : "array",
          minItems: 1,
          items   : {type: "string"}
        }
      },
      required            : ["hashName", "should_be_registered", "args"],
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
        var multi = [];
        
        return Promise.map(opts.args, function (arg) {
            
            multi.push([
              'hdel',
              opts.hashName,
              arg
            ]);
            
            return true;
            
          })
          .then(function () {
            return redis_client.multi(multi)
              .execAsync();
          });
      });
  };
};