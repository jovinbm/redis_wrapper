var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: true
});

var schema = {
  type                : "object",
  properties          : {
    set_name            : {
      type     : 'string',
      minLength: 1
    },
    should_be_registered: {
      type: 'boolean'
    },
    args                : {
      type    : "array",
      minItems: 2,
      items   : [
        {type: "number"},
        {type: "string"}
      ]
    }
  },
  required            : ["set_name", "should_be_registered", "args"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (RedisWrapper) {
  
  /**
   * Adds all the specified members with the specified scores to the sorted set stored at key
   * @param {object} opts
   * @param {string} opts.set_name
   * @param {boolean} opts.should_be_registered - if key should be registered in global registered keys
   * @param {object[]} opts.args e.g [100, 'jesus', 50, 'jovin'] i.e. [score, name, score, name, ...]
   * @returns {*}
   */
  RedisWrapper.prototype._zadd = function (opts) {
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
        
        if (self.validateKey(opts.set_name)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        opts.args.unshift(opts.set_name);
        return client.zadd(opts.args);
      });
  };
};