module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  var ajv     = require("ajv")({
    removeAdditional: true
  });
  
  /**
   *
   * @param {object} opts
   * @param {string} opts.setName
   * @param {number} opts.max
   * @param {number} opts.min
   * @param {boolean} opts.withScores
   * @param {boolean} opts.limit
   * @param {boolean} opts.should_be_registered - if key should be registered in global registered keys
   * @returns {*}
   */
  Redis_wrapper.prototype._zrangebyscore = function (opts) {
    var self         = this;
    var redis_client = Redis_wrapper.redis_client;
    
    var schema = {
      type                : "object",
      properties          : {
        setName             : {
          type     : 'string',
          minLength: 1
        },
        max                 : {
          type     : 'number',
          minLength: 1
        },
        min                 : {
          type     : 'number',
          minLength: 1
        },
        withScores          : {
          type: 'boolean'
        },
        limit               : {
          type: 'boolean'
        },
        should_be_registered: {
          type: 'boolean'
        }
      },
      required            : ["setName", "should_be_registered", "max", "min"],
      additionalProperties: false
    };

    var valid = ajv.validate(schema, opts);

    if (!valid) {
      var e = new Error(ajv.errorsText());
      e.ajv = ajv.errors;
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
        
        var args = [opts.setName, opts.min, opts.max];
        
        if (opts.withScores) {
          args.push('WITHSCORES');
        }
        else {
          args.push('');
        }
        
        return redis_client.zrangebyscoreAsync(args);
      });
  };
};