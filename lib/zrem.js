var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: true
});

var schema = {
  type                : "object",
  required            : ["set_name", "should_be_registered", "args"],
  additionalProperties: false,
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
      minItems: 1,
      items   : {type: "string"}
    }
  }
};

var validate = ajv.compile(schema);

module.exports = function (RedisWrapper) {
  
  /**
   * Removes the specified members from the sorted set stored at key. Non existing members are ignored.
   * @param {object} opts
   * @param {string} opts.set_name
   * @param {boolean} opts.should_be_registered - if key should be registered in global registered keys
   * @param {object[]} opts.args e.g ['jesus', 'jovin'] i.e. [name, name, ...]
   * @returns {*}
   */
  RedisWrapper.prototype._zrem = function (opts) {
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
        var multi = [];
        
        return BPromise.map(opts.args, function (arg, i) {
          
          multi.push([
            'zrem',
            opts.set_name,
            opts.args[i] // name
          ]);
          
          return true;
          
        })
          .then(function () {
            return client.multi(multi)
              .exec();
          });
      });
  };
};