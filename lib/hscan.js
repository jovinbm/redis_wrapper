var BPromise = require('bluebird');
var ajv      = require("ajv")({
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
    var self   = this;
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
        
        const has_keys = [];
        
        return new BPromise(function (resolve, reject) {
          
          var stream = client.hscanStream(opts.hash_name, {
            match: opts.match_pattern,
            count: opts.count
          });
          
          stream.on('data', function (resultKeys) {
            for (var i = 0; i < resultKeys.length; i++) {
              has_keys.push(resultKeys[i]);
            }
          });
          
          stream.on('end', function () {
            resolve(has_keys);
          });
          
          stream.on('error', function (e) {
            reject(e);
          });
          
        });
        
      })
      .then(function (hash_keys) {
        
        const retrieved_data = {};
        
        return BPromise.each(hash_keys, function (element, i) {
          
          if (i % 2 !== 0) {
            // key starts at 0,
            // even keys are values, 0 and other odd keys are hash_keys
            return true;
          }
          
          retrieved_data[element] = hash_keys[i + 1];
          
          return true;
        })
          .then(function () {
            
            return {
              data: retrieved_data
            };
            
          });
      });
  };
};