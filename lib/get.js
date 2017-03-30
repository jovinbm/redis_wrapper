const ajv = require('ajv')({
  removeAdditional: false
});

const schema = {
  type                : 'object',
  properties          : {
    key_name            : {
      type: 'string'
    },
    should_be_registered: {
      type: 'boolean'
    }
  },
  required            : ['key_name'],
  additionalProperties: false
};

const validate = ajv.compile(schema);

/**
 * Get the value of key. If the key does not exist the special value nil is returned
 * @param params
 * @param {string} params.key_name
 * @param {boolean} [params.should_be_registered=false] - if every the hash should be registered in global registered keys
 * @returns {*}
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
          key_name,
          should_be_registered = false
        }                      = params;
  
  if (should_be_registered) {
    if (!self.validateKey(key_name)) {
      throw new Error('Validate key failed');
    }
  }
  
  return client.get(key_name)
    .then(d => d || null);
};