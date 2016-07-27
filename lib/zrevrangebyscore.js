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
   * Returns all the elements in the sorted set at key with a score between min_score and max_score (including elements with score
   * equal to min_score or max_score). The elements are considered to be ordered from low to high scores.
   * @param {object} opts
   * @param {string} opts.set_name
   * @param {number} opts.max_score
   * @param {number} opts.min_score
   * @param {boolean} [opts.with_scores]
   * @param {object} [opts.limit]
   * @param {number} [opts.limit.count]
   * @param {number} [opts.limit.offset]
   * @param {boolean} opts.should_be_registered - if key should be registered in global registered keys
   * @returns {Promise.<object[]>} e.g. with_scores: false => [jovin,jesus], with_scores: true => [jovin,100,jesus,200]
   */
  RedisWrapper.prototype._zrevrangebyscore = function (opts) {
    var self         = this;
    var redis_client = self.redis_client;
    
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
        
        var args = [opts.set_name, opts.max_score, opts.min_score];
        
        if (opts.with_scores) {
          args.push('WITHSCORES');
        }
        
        if (opts.limit) {
          args.push('LIMIT');
          args.push(opts.limit.offset);
          args.push(opts.limit.count);
        }
        
        return redis_client.zrevrangebyscoreAsync(args);
      });
  };
};