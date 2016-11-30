const BPromise = require('bluebird');
const ajv      = require('ajv')({
  removeAdditional: false
});

const schema = {
  type                : 'object',
  properties          : {
    hash_name           : {
      type     : 'string',
      minLength: 1
    },
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
  },
  required            : ['hash_name', 'key_name', 'data'],
  additionalProperties: false
};

const validate = ajv.compile(schema);

/**
 * Sets field in the hash stored at key to value. If key does not exist, a new key holding a hash is created.
 * If field already exists in the hash, it is overwritten.
 * @this RedisWrapper
 * @param {object} params
 * @param {string} params.hash_name
 * @param {string} params.key_name
 * @param {string} params.data
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
          key_name,
          data,
          overwrite            = true,
          max_life_seconds,
          should_be_registered = false
        }                      = params;
  
  return BPromise.resolve()
    .then(function () {
      
      if (!should_be_registered) {
        return true;
      }
      
      if (self.validateKey(hash_name)) {
        return true;
      }
      else {
        throw new Error('Validate key failed');
      }
    })
    .then(() => {
      
      let all_commands = [];
      
      return BPromise.resolve()
        .then(function () {
          let command;
          
          if (overwrite) {
            command = [
              'hset',
              hash_name,
              key_name,
              data
            ];
          }
          else {
            command = [
              'hsetnx',
              hash_name,
              key_name,
              data
            ];
          }
          
          all_commands.push(command);
          
          return true;
        })
        .then(function () {
          if (!max_life_seconds) {
            return true;
          }
          
          return self.prepareHashKeyExpireRepresentative({
            hash_name       : hash_name,
            key_names       : [key_name],
            max_life_seconds: max_life_seconds
          })
            .then(function (zadd_commands) {
              all_commands = all_commands.concat(zadd_commands);
              
              return true;
            });
        })
        .then(function () {
          return client.multi(all_commands)
            .exec();
        });
    });
};