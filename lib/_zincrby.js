module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  var ajv     = require("ajv")({
    removeAdditional: true
  });
  
  /**
   *
   * @param {object} opts
   * @param {string} opts.setName
   * @param {boolean} opts.should_be_registered - if key should be registered in global registered keys
   * @param {object[]} opts.args e.g [1, 'jesus', 2, 'jovin'] i.e. [score, name, score, name, ...]
   * @returns {*}
   */
  Redis_wrapper.prototype._zincrby = function (opts) {
    var redis_client = Redis_wrapper.redis_client;
    
    var schema = {
      type                : "object",
      properties          : {
        setName             : {
          type     : 'string',
          minLength: 1
        },
        should_be_registered: {
          type: 'boolean'
        },
        args                : {
          type    : "array",
          minItems: 2,
          items   : [
            {type: "number"},
            {type: "string"}
          ]
        }
      },
      required            : ["setName", "should_be_registered", "args"],
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
        
        if (Redis_wrapper.validateKey(opts.setName)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        var multi = [];
        
        return Promise.map(opts.args, function (arg, i) {
            if (i % 2 > 0) { // loop evenly
              return true;
            }
            
            if (i >= opts.args.length) {
              return true;
            }
            
            multi.push([
              'zincrby',
              opts.setName,
              opts.args[i], // number to incr-by
              opts.args[i + 1] // name of key
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