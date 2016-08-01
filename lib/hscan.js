var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: false
});

var schema = {
  type                : "object",
  required            : ["hash_name", "cursor", "match_pattern", "count", "should_be_registered"],
  additionalProperties: false,
  properties          : {
    hash_name           : {
      type     : 'string',
      minLength: 1
    },
    cursor              : {
      type   : 'integer',
      minimum: 0
    },
    match_pattern       : {
      type     : 'string',
      minLength: 1
    },
    count               : {
      type   : 'integer',
      minimum: 1
    },
    should_be_registered: {
      type: 'boolean'
    }
  }
};

var validate = ajv.compile(schema);

module.exports = function (Redis_wrapper) {
  
  /**
   * @param {object} opts
   * @param {string} opts.hash_name
   * @param {number} opts.cursor
   * @param {string} opts.match_pattern
   * @param {number} opts.count
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @returns {Promise.<object>} - The object -> {cursor: {integer}the_cursor, data: {object}{hash_key: data, hash_key: data, ...}}
   */
  Redis_wrapper.prototype._hscan = function (opts) {
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
        
        if (self.validateKey(opts.hash_name)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        
        var command = [
          'hscan',
          opts.hash_name,
          opts.cursor,
          'MATCH',
          opts.match_pattern,
          'COUNT',
          opts.count
        ];
        
        var cursor         = 0;
        var retrieved_data = {};
        
        return BPromise.resolve()
          .then(function () {
            redis_client.multi([
              command
            ])
              .execAsync();
          })
          .then(function (d) {
            
            cursor   = d[0][0];
            var data = d[0][1];
            
            return BPromise.map(data, function (k, i) {
              
              if (i % 2 !== 0) {
                // key starts at 0,
                // even keys are values, 0 and other odd keys are hash_keys
                return true;
              }
              
              retrieved_data[k] = data[i + 1];
              return true;
            });
          })
          .then(function () {
            return {
              cursor: cursor,
              data  : retrieved_data
            };
          });
      });
  };
};