const BPromise = require('bluebird');
const ajv      = require('ajv')({
  removeAdditional: false
});

const schema = {
  type                : 'object',
  properties          : {
    should_be_registered: {
      type: 'boolean'
    },
    args                : {
      type    : 'array',
      minItems: 1,
      items   : {type: 'string'}
    }
  },
  required            : ['args'],
  additionalProperties: false
};

const validate = ajv.compile(schema);

/**
 * @this RedisWrapper
 * @param {object} params
 * @param {object[]} params.args e.g ['jesus', 'jovin'] i.e. [name, name, ...]
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
          should_be_registered = false,
          args
        }                      = params;
  
  return BPromise.resolve()
    .then(function () {
      
      if (!should_be_registered) {
        return true;
      }
      
      return BPromise.map(args, function (key) {
        
        if (self.validateKey(key)) {
          
          return true;
          
        }
        else {
          
          throw new Error('Validate key failed');
           
          
        }
      });
    })
    .then(function () {
      return client.del(args);
    });
};