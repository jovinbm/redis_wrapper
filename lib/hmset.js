const BPromise = require('bluebird');
const ajv      = require('ajv')({
  removeAdditional: false
});

const schema = {
  type                : 'object',
  required            : ['hash_name', 'args'],
  additionalProperties: false,
  properties          : {
    hash_name           : {
      type     : 'string',
      minLength: 1
    },
    args                : {
      type: 'object'
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
 * Sets field in the hash stored at key to value. If key does not exist, a new key holding a hash is created.
 * If field already exists in the hash, it is overwritten.
 * @this RedisWrapper
 * @param {object} params
 * @param {string} params.hash_name
 * @param {object} params.args e.g {key: {String}val, key: {String}val}
 * @param {boolean} [params.overwrite=true]
 * @param {number} [params.max_life_seconds]
 * @param {boolean} [params.should_be_registered=false] - if the hash should be registered in global registered keys
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
          args,
          overwrite            = true,
          max_life_seconds,
          should_be_registered = false
        }                      = params;
  
  if (should_be_registered) {
    if (!self.validateKey(hash_name)) {
      throw new Error('Validate key failed');
    }
  }
  
  let all_commands = [];
  
  Object.keys(args).map(key => {
    
    let command;
    
    if (overwrite) {
      command = [
        'hset',
        hash_name,
        key,
        args[key]
      ];
    }
    else {
      command = [
        'hsetnx',
        hash_name,
        key,
        args[key]
      ];
    }
    
    all_commands.push(command);
    
    return true;
    
  });
  
  return BPromise.resolve()
    .then(function () {
      
      if (!max_life_seconds) {
        return true;
      }
      
      // get the hash expiration representatives
      return self.prepareHashKeyExpireRepresentative({
        hash_name       : hash_name,
        key_names       : Object.keys(args),
        max_life_seconds: max_life_seconds
      })
        .then(function (zadd_commands) {
          // append the commands
          all_commands = all_commands.concat(zadd_commands);
          
          return true;
        });
    })
    .then(function () {
      
      return client.multi(all_commands)
        .exec();
      
    });
};