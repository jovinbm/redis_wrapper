const ajv = require('ajv')({
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
    args                : {
      type    : 'array',
      minItems: 1,
      items   : {type: 'string'}
    }
  },
  required            : ['hash_name', 'args'],
  additionalProperties: false
};

const validate = ajv.compile(schema);

/**
 * Removes the specified fields from the hash stored at key. Specified fields that do not exist within this hash are
 * ignored. If key does not exist, it is treated as an empty hash and this command returns 0
 * @param {object} params
 * @param {string} params.hash_name
 * @param {object[]} params.args e.g ['jesus', 'jovin'] i.e. [name, name, ...]
 * @param {boolean} [params.should_be_registered=false] - if every the hash should be registered in global registered keys
 * @this RedisWrapper
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
          hash_name,
          should_be_registered = false,
          args
        }                      = params;
  
  if (should_be_registered) {
    if (!self.validateKey(hash_name)) {
      throw new Error('Validate key failed');
    }
  }
  
  const multi = [];
  
  args.map(arg => {
    multi.push([
      'hdel',
      hash_name,
      arg
    ]);
    
    return true;
  });
  
  return client.multi(multi)
    .exec();
};