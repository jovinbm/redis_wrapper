var Promise = require('bluebird');
var ajv     = require("ajv")({
  removeAdditional: false
});

var schema = {
  type                : "object",
  properties          : {
    hash_name           : {
      type: 'string'
    },
    should_be_registered: {
      type: 'boolean'
    },
    args                : {
      type: "object"
    }
  },
  required            : ["hash_name", "should_be_registered", "args"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (Redis_wrapper) {
  
  /**
   *
   * @param {object} opts
   * @param {string} opts.hash_name
   * @param {boolean} opts.should_be_registered - if the hash should be registered in global registered keys
   * @param {object} opts.args e.g {key: val, key: val}
   * @returns {*}
   */
  Redis_wrapper.prototype._hset = function (opts) {
    var self         = this;
    var redis_client = self.redis_client;
  
    var valid = validate(opts);
  
    if (!valid) {
      var e = new Error(ajv.errorsText(validate.errors));
      e.ajv = validate.errors;
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
        var multi = [];
        
        return Promise.map(Object.keys(opts.args), function (key) {
            
            multi.push([
              'hset',
              opts.hash_name,
              key,
              JSON.stringify({
                data      : opts.args[key],
                created_at: Date.now()
              })
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