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
    should_be_registered: {
      type: 'boolean'
    },
    args                : {
      type    : "array",
      minItems: 1,
      items   : {type: "string"}
    }
  },
  required            : ["hash_name", "should_be_registered", "args"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (Redis_wrapper) {
  
  /**
   * Removes the specified fields from the hash stored at key. Specified fields that do not exist within this hash are
   * ignored. If key does not exist, it is treated as an empty hash and this command returns 0
   * @param {object} opts
   * @param {string} opts.hash_name
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @param {object[]} opts.args e.g ['jesus', 'jovin'] i.e. [name, name, ...]
   * @returns {*}
   */
  Redis_wrapper.prototype._hdel = function (opts) {
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
        var multi = [];
        
        return BPromise.map(opts.args, function (arg) {
          
          multi.push([
            'hdel',
            opts.hash_name,
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