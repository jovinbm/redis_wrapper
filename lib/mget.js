const ajv = require('ajv')({
  removeAdditional: false
});

const schema = {
  type                : 'object',
  properties          : {
    key_names           : {
      type    : 'array',
      minItems: 1,
      items   : {
        type     : 'string',
        minLength: 1
      }
    },
    should_be_registered: {
      type: 'boolean'
    },
    max_life_seconds    : {
      type: 'integer'
    }
  },
  required            : ['key_names'],
  additionalProperties: false
};

const validate = ajv.compile(schema);

/**
 * @this RedisWrapper
 * @param params
 * @param {object[]} params.key_names - an array of key_names to be retrieved
 * @param {boolean} [params.should_be_registered=false] - if the key should be registered in global registered keys
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
          key_names,
          should_be_registered = false
        }                      = params;
  
  if (should_be_registered) {
    Object.keys(key_names).map(key => {
      if (self.validateKey(key)) {
        return true;
      }
      else {
        throw new Error('Validate key failed');
      }
    });
  }
  
  return client.mget(key_names)
    .then(results => {
      
      if (!results) {
        results = [];
      }
      
      const final_object = {};
      
      // if a field does not exist, according to redis, it is set to (nil), but node_redis sets it to null
      results.map((d, i) => {
        
        if (!d) {
          final_object[key_names[i]] = null;
        }
        else {
          final_object[key_names[i]] = d;
        }
        
        return true;
        
      });
      
      return final_object;
    });
};