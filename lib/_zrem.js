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
      minItems: 1,
      items   : {type: "string"}
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
   * @param {object[]} opts.args e.g ['jesus', 'jovin'] i.e. [name, name, ...]
   * @returns {*}
   */
  Redis_wrapper.prototype._zrem = function (opts) {
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
        var multi = [];
        
        return Promise.map(opts.args, function (arg, i) {
            
            multi.push([
              'zrem',
              opts.setName,
              opts.args[i] // name
            ]);
            
            return true;
            
          })
          .then(function () {
            return redis_client.multi(multi)
              .execAsync();
          });
      });
  };
};