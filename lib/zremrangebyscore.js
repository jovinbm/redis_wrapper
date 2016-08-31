var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: true
});

var schema = {
  type                : "object",
  required            : ["set_name", "should_be_registered", "max_score", "min_score"],
  additionalProperties: false,
  properties          : {
    set_name            : {
      type     : 'string',
      minLength: 1
    },
    max_score           : {
      type: 'number'
    },
    min_score           : {
      type: 'number'
    },
    with_scores         : {
      type: 'boolean'
    },
    limit               : {
      type                : "object",
      required            : ["offset", "count"],
      additionalProperties: false,
      properties          : {
        count : {
          type   : 'integer',
          minimum: 1
        },
        offset: {
          type   : 'integer',
          minimum: 0
        }
      }
    },
    should_be_registered: {
      type: 'boolean'
    }
  }
};

var validate = ajv.compile(schema);

module.exports = function (RedisWrapper) {
  
  /**
   * Removes all elements in the sorted set stored at key with a score between min and max (inclusive).
   * @param {object} opts
   * @param {string} opts.set_name
   * @param {number} opts.max_score - inclusive
   * @param {number} opts.min_score - inclusive
   * @param {boolean} opts.should_be_registered - if key should be registered in global registered keys
   * @returns {*}
   */
  RedisWrapper.prototype._zremrangebyscore = function (opts) {
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
        
        var args = [opts.set_name, opts.min_score, opts.max_score];
        
        return client.zremrangebyscore(args);
      });
  };
};