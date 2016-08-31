var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: false
});

var schema = {
  type                : "object",
  properties          : {
    key_name            : {
      type: 'string'
    },
    should_be_registered: {
      type: 'boolean'
    }
  },
  required            : ["key_name", "should_be_registered"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (Redis_wrapper) {
  
  /**
   * Get the value of key. If the key does not exist the special value nil is returned
   * @param opts
   * @param {string} opts.key_name
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @returns {*}
   */
  Redis_wrapper.prototype._get = function (opts) {
    var self   = this;
    var client = self.client;
    
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
        
        if (self.validateKey(opts.key_name)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        return client.get(opts.key_name)
          .then(function (d) {
            return d;
          });
      });
  };
};