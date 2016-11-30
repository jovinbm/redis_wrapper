const BPromise = require('bluebird');
const ajv      = require('ajv')({
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
      type    : 'array',
      minItems: 1,
      items   : {type: 'string'}
    }
  }
};

const validate = ajv.compile(schema);

/**
 * Removes the specified members from the sorted set stored at key. Non existing members are ignored.
 * @this RedisWrapper
 * @param {object} params
 * @param {string} params.set_name
 * @param {object[]} params.args e.g ['jesus', 'jovin'] i.e. [name, name, ...]
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
  
  return BPromise.resolve()
    .then(function () {
      
      if (!should_be_registered) {
        return true;
      }
      
      if (self.validateKey(set_name)) {
        return true;
      }
      else {
        throw new Error('Validate key failed');
      }
    })
    .then(function () {
      const multi = [];
      
      args.map((arg, i) => {
        
        multi.push([
          'zrem',
          set_name,
          args[i] // name
        ]);
        
        return true;
        
      });
      
      return client.multi(multi)
        .exec();
    });
};