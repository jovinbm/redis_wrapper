const BPromise = require('bluebird');
const ajv      = require('ajv')({
  removeAdditional: false
});

const schema = {
  type                : 'object',
  properties          : {
    args                : {
      type: 'object'
    },
    overwrite           : {
      type: 'boolean'
    },
    should_be_registered: {
      type: 'boolean'
    },
    max_life_seconds    : {
      type: 'integer'
    }
  },
  required            : ['args'],
  additionalProperties: false
};

const validate = ajv.compile(schema);

/**
 * @this RedisWrapper
 * @param {object} params
 * @param {object} params.args e.g {key: {String}val, key: {String}val}
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
          args,
          overwrite            = true,
          max_life_seconds,
          should_be_registered = false
        }                      = params;
  
  if (should_be_registered) {
    Object.keys(args).map(key => {
      if (self.validateKey(key)) {
        return true;
      }
      else {
        throw new Error('Validate key failed');
      }
    });
  }
  
  if (Object.keys(args).length === 0) {
    return BPromise.resolve(true);
  }
  
  const multi_commands = [];
  
  Object.keys(args).map(key => {
    
    const command = ['set', key, args[key]];
    
    if (max_life_seconds) {
      command.push('ex');
      command.push(max_life_seconds);
    }
    
    if (!overwrite) {
      command.push('nx');
    }
    
    multi_commands.push(command);
    
    return true;
    
  });
  
  return client.multi(multi_commands)
    .exec();
  
};