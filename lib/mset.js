var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: false
});

var schema = {
  type                : "object",
  properties          : {
    args                : {
      type: "object"
    },
    overwrite           : {
      type: 'boolean'
    },
    should_be_registered: {
      type: 'boolean'
    },
    max_life_seconds    : {
      type: 'integer'
    }
  },
  required            : ["overwrite", "args", "should_be_registered"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (RedisWrapper) {
  
  /**
   *
   * @param {object} opts
   * @param {object} opts.args e.g {key: {String}val, key: {String}val}
   * @param {boolean} opts.overwrite
   * @param {number} [opts.max_life_seconds]
   * @param {boolean} opts.should_be_registered - if every key should be registered in global registered keys
   * @returns {*}
   */
  RedisWrapper.prototype._mset = function (opts) {
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
        
        return BPromise.map(Object.keys(opts.args), function (key) {
          if (self.validateKey(key)) {
            return true;
          }
          else {
            throw new Error('Validate key failed');
          }
        });
      })
      .then(function () {
        
        if (Object.keys(opts.args).length === 0) {
          return true;
        }
        
        var multi_commands = [];
        
        return BPromise.map(Object.keys(opts.args), function (key) {
          var command = ['set', key, opts.args[key]];
          
          if (opts.max_life_seconds) {
            command.push('ex');
            command.push(opts.max_life_seconds);
          }
          
          if (!opts.overwrite) {
            command.push('nx');
          }
          
          multi_commands.push(command);
          return true;
        })
          .then(function () {
            return client.multi(multi_commands)
              .exec();
          });
      });
  };
};