var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: false
});

var schema = {
  type                : "object",
  required            : ["key_name", "data", "overwrite", "should_be_registered"],
  additionalProperties: false,
  properties          : {
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
  }
};

var validate = ajv.compile(schema);

module.exports = function (RedisWrapper) {
  
  /**
   *
   * @param {object} opts
   * @param {string} opts.key_name
   * @param {string} opts.data
   * @param {boolean} opts.overwrite
   * @param {number} [opts.max_life_seconds]
   * @param {boolean} opts.should_be_registered - if every key should be registered in global registered keys
   * @returns {*}
   */
  RedisWrapper.prototype._set = function (opts) {
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
        
        if (self.validateKey(opts.key_name)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        
        var command = ['set', opts.key_name, opts.data];
        
        if (opts.max_life_seconds) {
          command.push('ex');
          command.push(opts.max_life_seconds);
        }
        
        if (!opts.overwrite) {
          command.push('nx');
        }
        
        return client.multi([
          command
        ])
          .exec();
      });
  };
};