var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: true
});

var schema = {
  type                : "object",
  required            : ["set_name", "should_be_registered", "start_index", "stop_index"],
  additionalProperties: false,
  properties          : {
    set_name            : {
      type     : 'string',
      minLength: 1
    },
    start_index         : {
      type   : 'number'
    },
    stop_index          : {
      type   : 'number'
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
   * Returns the specified range of elements in the sorted set stored at key. The elements are considered to be "ordered
   * from the highest to the lowest score". Descending lexicographical order is used for elements with equal score. Apart
   * from the reversed ordering, ZREVRANGE is similar to ZRANGE.
   * @param {object} opts
   * @param {string} opts.set_name
   * @param {number} opts.start_index - start_index index, zero based index
   * @param {number} opts.stop_index  - end index, zero based index
   * @param {boolean} [opts.with_scores]
   * @param {object} [opts.limit]
   * @param {number} [opts.limit.count]
   * @param {number} [opts.limit.offset]
   * @param {boolean} opts.should_be_registered - if key should be registered in global registered keys
   * @returns {Promise.<object[]>} e.g. with_scores: false => [jovin,jesus], with_scores: true => [jovin,100,jesus,200]
   */
  RedisWrapper.prototype._zrevrange = function (opts) {
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
        
        var args = [opts.set_name, opts.start_index, opts.stop_index];
        
        if (opts.with_scores) {
          args.push('WITHSCORES');
        }
        
        if (opts.limit) {
          args.push('LIMIT');
          args.push(opts.limit.offset);
          args.push(opts.limit.count);
        }
        
        return redis_client.zrevrangeAsync(args);
      });
  };
};