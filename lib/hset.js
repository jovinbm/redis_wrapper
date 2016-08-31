var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: false
});

var schema = {
  type                : "object",
  properties          : {
    hash_name           : {
      type     : 'string',
      minLength: 1
    },
    key_name            : {
      type     : 'string',
      minLength: 1
    },
    data                : {
      type     : 'string',
      minLength: 1
    },
    overwrite           : {
      type: 'boolean'
    },
    max_life_seconds    : {
      type: 'integer'
    },
    should_be_registered: {
      type: 'boolean'
    }
  },
  required            : ["hash_name", "key_name", "data", "overwrite", "should_be_registered"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (Redis_wrapper) {
  
  /**
   * Sets field in the hash stored at key to value. If key does not exist, a new key holding a hash is created.
   * If field already exists in the hash, it is overwritten.
   * @param {object} opts
   * @param {string} opts.hash_name
   * @param {string} opts.key_name
   * @param {string} opts.data
   * @param {boolean} opts.overwrite
   * @param {number} [opts.max_life_seconds]
   * @param {boolean} opts.should_be_registered - if the hash should be registered in global registered keys
   * @returns {*}
   */
  Redis_wrapper.prototype._hset = function (opts) {
    var self         = this;
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
        
        if (self.validateKey(opts.hash_name)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        
        var all_commands = [];
        
        return BPromise.resolve()
          .then(function () {
            var command;
            
            if (opts.overwrite) {
              command = [
                'hset',
                opts.hash_name,
                opts.key_name,
                opts.data
              ];
            }
            else {
              command = [
                'hsetnx',
                opts.hash_name,
                opts.key_name,
                opts.data
              ];
            }
            
            all_commands.push(command);
            return true;
          })
          .then(function () {
            if (!opts.max_life_seconds) {
              return true;
            }
            
            return self.prepareHashKeyExpireRepresentative({
              hash_name       : opts.hash_name,
              key_names       : [opts.key_name],
              max_life_seconds: opts.max_life_seconds
            })
              .then(function (zadd_commands) {
                all_commands = all_commands.concat(zadd_commands);
                return true;
              });
          })
          .then(function () {
            return client.multi(all_commands)
              .exec();
          });
      });
  };
};