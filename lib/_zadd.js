var Promise = require('bluebird');
var ajv     = require("ajv")({
  removeAdditional: true
});

var schema = {
  type                : "object",
  properties          : {
    setName             : {
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
  required            : ["setName", "should_be_registered", "args"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (Redis_wrapper) {
  
  /**
   *
   * @param {object} opts
   * @param {string} opts.setName
   * @param {boolean} opts.should_be_registered - if key should be registered in global registered keys
   * @param {object[]} opts.args e.g [100, 'jesus', 50, 'jovin'] i.e. [score, name, score, name, ...]
   * @returns {*}
   */
  Redis_wrapper.prototype._zadd = function (opts) {
    var self         = this;
    var redis_client = self.redis_client;

    var valid = validate(schema, opts);

    if (!valid) {
      var e = new Error(validate.errorsText());
      e.ajv = validate.errors;
      throw e;
    }
    
    return Promise.resolve()
      .then(function () {
        
        if (!opts.should_be_registered) {
          return true;
        }
        
        if (self.validateKey(opts.setName)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        opts.args.unshift(opts.setName);
        return redis_client.zaddAsync(opts.args);
      });
  };
};