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
    key_name            : {
      type: 'string'
    },
    should_be_registered: {
      type: 'boolean'
    },
    max_life_seconds    : {
      type: 'integer'
    }
  },
  required            : ["hash_name", "key_name", "should_be_registered"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (Redis_wrapper) {
  
  /**
   *
   * @param opts
   * @param {string} opts.hash_name
   * @param {string} opts.key_name
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @param {number} [opts.max_life_seconds]
   * @returns {*}
   */
  Redis_wrapper.prototype._hget = function (opts) {
    var self         = this;
    var redis_client = self.redis_client;

    var valid = validate(schema, opts);

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
        //get the hash key
        return redis_client.hgetAsync(opts.hash_name, opts.key_name)
          .then(function (d) {

            if (!d) {
              return null;
            }

            d = JSON.parse(d);

            if (!opts.max_life_seconds) {
              return d.data;
            }

            if ((Date.now() - d.created_at) / 1000 > opts.max_life_seconds) {
              // remove it
              return self._hdel({
                  should_be_registered: true,
                  hash_name           : opts.hash_name,
                  args                : [opts.key_name]
                })
                .then(function () {
                  return null;
                });
            }

            return d.data;

          });
      });
  };
};