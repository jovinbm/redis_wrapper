var Promise = require('bluebird');
var ajv     = require("ajv")({
  removeAdditional: false
});

var schema = {
  type                : "object",
  properties          : {
    should_be_registered: {
      type: 'boolean'
    },
    args                : {
      type    : "array",
      minItems: 1,
      items   : {type: "string"}
    }
  },
  required            : ["should_be_registered", "args"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (Redis_wrapper) {
  
  /**
   *
   * @param {object} opts
   * @param {boolean} opts.should_be_registered - if every key should be registered in global registered keys
   * @param {object[]} opts.args e.g ['jesus', 'jovin'] i.e. [name, name, ...]
   * @returns {*}
   */
  Redis_wrapper.prototype._del = function (opts) {
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
        
        return Promise.map(opts.args, function (key) {
          if (self.validateKey(key)) {
            return true;
          }
          else {
            throw new Error('Validate key failed');
          }
        });
      })
      .then(function () {
        return redis_client.delAsync(opts.args);
      });
  };
};