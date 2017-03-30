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
    }
  },
  required            : ['key_names'],
  additionalProperties: false
};

const validate = ajv.compile(schema);

/**
 * Return value: Integer reply, specifically: 1 if the key exists. 0 if the key does not exist. The number of keys
 * existing among the ones specified as arguments. Keys mentioned multiple times and existing are counted multiple times.
 * @param params
 * @param {string} params.key_names
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
          key_names,
          should_be_registered = false
        }                      = params;
  
  if (should_be_registered) {
    key_names.map(key => {
      
      if (self.validateKey(key)) {
        return true;
      }
      else {
        throw new Error('Validate key failed');
      }
      
    });
  }
  
  return client.exists(key_names);
  
};