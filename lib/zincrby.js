const ajv = require('ajv')({
  removeAdditional: true
});

const schema = {
  type                : 'object',
  required            : ['set_name', 'args'],
  additionalProperties: false,
  properties          : {
    set_name            : {
      type     : 'string',
      minLength: 1
    },
    should_be_registered: {
      type: 'boolean'
    },
    args                : {
      type             : 'object',
      patternProperties: {
        '^.*$': {
          type: 'integer'
        }
      }
    }
  }
};

const validate = ajv.compile(schema);

/**
 * Increments the score of member in the sorted set stored at key by increment
 * @this RedisWrapper
 * @param {object} params
 * @param {string} params.set_name
 * @param {object} params.args e.g {key: score, key: score}
 * @param {boolean} [params.should_be_registered=false] - if key should be registered in global registered keys
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
          set_name,
          should_be_registered = false,
          args
        }                      = params;
  
  if (!should_be_registered) {
    if (!self.validateKey(set_name)) {
      throw new Error('Validate key failed');
    }
  }
  
  const multi = [];
  
  Object.keys(args).map((key) => {
    
    multi.push([
      'zincrby',
      set_name,
      args[key],
      key
    ]);
    
    return true;
    
  });
  
  return client.multi(multi)
    .exec();
};