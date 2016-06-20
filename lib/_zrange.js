module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  var ajv     = require("ajv")({
    removeAdditional: true
  });
  
  /**
   *
   * @param {object} opts
   * @param {string} opts.setName
   * @param {number} opts.start
   * @param {number} opts.stop
   * @param {boolean} opts.withScores
   * @param {boolean} opts.limit
   * @param {boolean} opts.should_be_registered - if key should be registered in global registered keys
   * @returns {*}
   */
  Redis_wrapper.prototype._zrange = function (opts) {
    var self         = this;
    var redis_client = self.redis_client;
    
    var schema = {
      type                : "object",
      properties          : {
        setName             : {
          type     : 'string',
          minLength: 1
        },
        start               : {
          type     : 'number',
          minLength: 1
        },
        stop                : {
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
      required            : ["setName", "should_be_registered", "start", "stop"],
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
        
        var args = [opts.setName, opts.start, opts.stop];
        
        if (opts.withScores) {
          args.push('WITHSCORES');
        }
        else {
          args.push('');
        }
        
        return redis_client.zrangeAsync(args);
      });
  };
};