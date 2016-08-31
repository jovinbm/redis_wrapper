var BPromise     = require('bluebird');
var promiseWhile = require('../promise_while').promiseWhile;
var ajv          = require("ajv")({
  removeAdditional: false
});

var schema = {
  type                : "object",
  required            : ["hash_name", "match_pattern", "count", "should_be_registered"],
  additionalProperties: false,
  properties          : {
    hash_name           : {
      type     : 'string',
      minLength: 1
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
   * @param {string} opts.match_pattern
   * @param {number} opts.count
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @returns {Promise.<object>} - The object -> {cursor: {integer}the_cursor, data: {object}{hash_key: data, hash_key: data, ...}}
   */
  Redis_wrapper.prototype._hscan = function (opts) {
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
        
        if (self.validateKey(opts.hash_name)) {
          return true;
        }
        else {
          throw new Error('Validate key failed');
        }
      })
      .then(function () {
        
        var cursor         = 0;
        var retrieved_data = {};
        
        function predicate(cursor) {
          return cursor !== 0;
        }
        
        function action() {
          
          var command = [
            'hscan',
            opts.hash_name,
            cursor,
            'MATCH',
            opts.match_pattern,
            'COUNT',
            opts.count
          ];
          
          return BPromise.resolve()
            .then(function () {
              return client.multi([
                command
              ])
                .exec();
            })
            .then(function (d) {
              
              cursor   = Number(d[0][0]);
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
              return cursor;
            });
        }
        
        return promiseWhile(predicate, action, 1)
          .then(function () {
            return {
              cursor: cursor,
              data  : retrieved_data
            };
          });
      });
  };
};