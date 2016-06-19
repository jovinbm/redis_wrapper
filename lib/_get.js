module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  var ajv     = require("ajv")({
    removeAdditional: false
  });
  
  /**
   *
   * @param opts
   * @param {string} opts.keyName
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @returns {*}
   */
  Redis_wrapper.prototype._get = function (opts) {
    var redis_client = Redis_wrapper.redis_client;
    
    var schema = {
      type                : "object",
      properties          : {
        keyName             : {
          type: 'string'
        },
        should_be_registered: {
          type: 'boolean'
        }
      },
      required            : ["keyName", "should_be_registered"],
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

        if (Redis_wrapper.validateKey(opts.keyName)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        return redis_client.getAsync(opts.keyName)
          .then(function (d) {
            if (d) {
              return JSON.parse(d);
            }
            return d;
          });
      });
  };
};