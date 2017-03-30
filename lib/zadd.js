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
 * Adds all the specified members with the specified scores to the sorted set stored at key
 * @this RedisWrapper
 * @param {object} params
 * @param {string} params.set_name
 * @param {object} params.args e.g {key: score, key: score}
 * @param {boolean} [params.should_be_registered=false] - if key should be registered in global registered keysa
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
  
  // args format: [set_name, score, key, score, key,...]
  
  const zadd_args = [set_name];
  
  Object.keys(args).map(key => {
    
    zadd_args.push(args[key]);
    zadd_args.push(key);
    
    return true;
    
  });
  
  return client.zadd(zadd_args);
};