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
    key_name            : {
      type: 'string'
    },
    should_be_registered: {
      type: 'boolean'
    }
  },
  required            : ['hash_name', 'key_name'],
  additionalProperties: false
};

const validate = ajv.compile(schema);

/**
 * Return value: Integer reply, specifically: 1 if the hash contains field. 0 if the hash does not contain field, or key does not exist.
 * @param {object} params
 * @param {string} params.hash_name
 * @param {string} params.key_name
 * @param {boolean} [params.should_be_registered=false] - if every the hash should be registered in global registered keys
 * @this RedisWrapper
 * @returns {Promise.<boolean>}
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
          key_name,
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
    .then(function () {
      //get the hash key
      return client.hexists(hash_name, key_name)
        .then(function (d) {
          
          return d;
          
        });
    });
};