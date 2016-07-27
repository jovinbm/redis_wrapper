var BPromise = require('bluebird');
var ajv      = require("ajv")({
  removeAdditional: false
});

var schema = {
  type                : "object",
  properties          : {
    hash_name           : {
      type: 'string'
    },
    should_be_registered: {
      type: 'boolean'
    },
    max_life_seconds    : {
      type: 'integer'
    }
  },
  required            : ["hash_name", "should_be_registered"],
  additionalProperties: false
};

var validate = ajv.compile(schema);

module.exports = function (RedisWrapper) {
  
  /**
   * Returns all fields and values of the hash stored at key
   * @param opts
   * @param {string} opts.hash_name
   * @param {boolean} opts.should_be_registered - if every the hash should be registered in global registered keys
   * @returns {*} // object {key: value, key: value, key: value}
   */
  RedisWrapper.prototype._hgetall = function (opts) {
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
        return redis_client.hgetallAsync(opts.hash_name)
          .then(function (d) {
            return d;
          });
      })
      .then(function (ob) {
        
        if (!ob) {
          // user gave a non existent hash_name
          ob = {};
        }
        
        var final_object = {};
        
        return BPromise.map(Object.keys(ob), function (key_name) {
          
          var d = ob[key_name];
          
          if (!d) {
            final_object[key_name] = null;
          }
          else {
            final_object[key_name] = d;
          }
          
          return true;
        }, {concurrency: 50})
          .then(function () {
            return final_object;
          });
      });
  };
};