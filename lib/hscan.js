const BPromise = require('bluebird');
const ajv      = require('ajv')({
  removeAdditional: false
});

const schema = {
  type                : 'object',
  required            : ['hash_name', 'match_pattern', 'count'],
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

const validate = ajv.compile(schema);

/**
 * @this RedisWrapper
 * @param {object} params
 * @param {string} params.hash_name
 * @param {string} params.match_pattern
 * @param {number} params.count
 * @param {boolean} [params.should_be_registered=false] - if every the hash should be registered in global registered keys
 * @returns {Promise.<object>} - {data: {object}{hash_key: data, hash_key: data, ...}}
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
          match_pattern,
          count,
          should_be_registered = false
        }                      = params;
  
  return BPromise.resolve()
    .then(() => {
      
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
    .then(() => {
      
      const hash_keys = [];
      
      return new BPromise(function (resolve, reject) {
        
        const stream = client.hscanStream(hash_name, {
          match: match_pattern,
          count: count
        });
        
        stream.on('data', function (resultKeys) {
          for (let i = 0; i < resultKeys.length; i++) {
            hash_keys.push(resultKeys[i]);
          }
        });
        
        stream.on('end', function () {
          resolve(hash_keys);
        });
        
        stream.on('error', function (e) {
          reject(e);
        });
        
      });
      
    })
    .then(hash_keys => {
      
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