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
    args                : {
      type: "object"
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
  required            : ["hash_name", "args", "overwrite", "should_be_registered"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (Redis_wrapper) {
  
  /**
   * Sets field in the hash stored at key to value. If key does not exist, a new key holding a hash is created.
   * If field already exists in the hash, it is overwritten.
   * @param {object} opts
   * @param {string} opts.hash_name
   * @param {object} opts.args e.g {key: {String}val, key: {String}val}
   * @param {boolean} opts.overwrite
   * @param {number} [opts.max_life_seconds]
   * @param {boolean} opts.should_be_registered - if the hash should be registered in global registered keys
   * @returns {*}
   */
  Redis_wrapper.prototype._hmset = function (opts) {
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
      }).then(function () {
        
        var all_commands = [];
        
        return BPromise.map(Object.keys(opts.args), function (key) {
          var command;
          
          if (opts.overwrite) {
            command = [
              'hset',
              opts.hash_name,
              key,
              opts.args[key]
            ];
          }
          else {
            command = [
              'hsetnx',
              opts.hash_name,
              key,
              opts.args[key]
            ];
          }
          
          all_commands.push(command);
          return true;
        })
          .then(function () {
            if (!opts.max_life_seconds) {
              return true;
            }
            
            // get the hash expiration respresentatives
            return self.prepareHashKeyExpireRepresentative({
              hash_name       : opts.hash_name,
              key_names       : Object.keys(opts.args),
              max_life_seconds: opts.max_life_seconds
            })
              .then(function (zadd_commands) {
                // append the commands
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