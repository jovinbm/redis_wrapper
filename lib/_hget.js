module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  var ajv     = require("ajv")({
    removeAdditional: false
  });
  
  /**
   *
   * @param opts
   * @param {string} opts.hashName
   * @param {string} opts.key_name
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @param {number} [opts.max_life_seconds]
   * @returns {*}
   */
  Redis_wrapper.prototype._hget = function (opts) {
    var redis_client = Redis_wrapper.redis_client;
    
    var schema = {
      type                : "object",
      properties          : {
        hashName            : {
          type: 'string'
        },
        key_name             : {
          type: 'string'
        },
        should_be_registered: {
          type: 'boolean'
        },
        max_life_seconds    : {
          type: 'integer'
        }
      },
      required            : ["hashName", "key_name", "should_be_registered"],
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
        //get the hash key
        return redis_client.hgetAsync(opts.hashName, opts.key_name)
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
              return (new Redis_wrapper())._hdel({
                  should_be_registered: true,
                  hashName            : opts.hashName,
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