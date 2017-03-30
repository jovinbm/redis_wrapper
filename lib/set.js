const ajv = require('ajv')({
  removeAdditional: false
});

const schema = {
  type                : 'object',
  required            : ['key_name', 'data'],
  additionalProperties: false,
  properties          : {
    key_name            : {
      type     : 'string',
      minLength: 1
    },
    data                : {
      type     : 'string',
      minLength: 1
    },
    overwrite           : {
      type: 'boolean'
    },
    max_life_seconds    : {
      type: 'integer'
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
 * @param {string} params.key_name
 * @param {string} params.data
 * @param {boolean} [params.overwrite=true]
 * @param {number} [params.max_life_seconds]
 * @param {boolean} [params.should_be_registered=false] - if every key should be registered in global registered keys
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
          data,
          overwrite            = true,
          max_life_seconds,
          should_be_registered = false
        }                      = params;
  
  if (should_be_registered) {
    if (!self.validateKey(key_name)) {
      throw new Error('Validate key failed');
    }
  }
  
  const command = ['set', key_name, data];
  
  if (max_life_seconds) {
    command.push('ex');
    command.push(max_life_seconds);
  }
  
  if (!overwrite) {
    command.push('nx');
  }
  
  return client.multi([
    command
  ])
    .exec();
};