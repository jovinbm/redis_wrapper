var Promise = require('bluebird');
var ajv     = require("ajv")({
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
   *
   * @param opts
   * @param {string} opts.key_name
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @returns {*}
   */
  Redis_wrapper.prototype._get = function (opts) {
    var self         = this;
    var redis_client = self.redis_client;

    console.time('ajv');
    var valid = validate(opts);

    if (!valid) {
      var e = new Error(ajv.errorsText(validate.errors));
      e.ajv = validate.errors;
      throw e;
    }
    console.timeEnd('ajv');
    
    return Promise.resolve()
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
        return redis_client.getAsync(opts.key_name)
          .then(function (d) {
            if (d) {
              return JSON.parse(d);
            }
            return d;
          });
      });
  };
};