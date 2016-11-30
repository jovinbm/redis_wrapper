const BPromise = require('bluebird');
const ajv      = require('ajv')({
  removeAdditional: false
});

const schema = {
  type                : 'object',
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
  required            : ['hash_name'],
  additionalProperties: false
};

const validate = ajv.compile(schema);

/**
 * Returns all fields and values of the hash stored at key
 * @this RedisWrapper
 * @param params
 * @param {string} params.hash_name
 * @param {boolean} [params.should_be_registered=false] - if every the hash should be registered in global registered keys
 * @returns {*} // object {key: value, key: value, key: value}
 */
module.exports = function (params) {
  const self   = this;
  const client = self.client;
  
  const valid = validate(params);
  
  if (!valid) {
    const e = new Error(ajv.errorsText(validate.errors));
    
    e.ajv = validate.errors;
    throw e;
  }
  
  const {
          hash_name,
          should_be_registered = false
        }                      = params;
  
  return BPromise.resolve()
    .then(function () {
      
      if (!should_be_registered) {
        return true;
      }
      
      if (self.validateKey(hash_name)) {
        return true;
      }
      else {
        throw new Error('Validate key failed');
      }
    })
    .then(() => client.hgetall(hash_name))
    .then(ob => {
      
      if (!ob) {
        // user gave a non existent hash_name
        ob = {};
      }
      
      const final_object = {};
      
      return BPromise.map(Object.keys(ob), function (key_name) {
        
        const d = ob[key_name];
        
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