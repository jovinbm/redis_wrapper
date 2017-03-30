const BPromise  = require('bluebird');
const ajv       = require('ajv')({
  removeAdditional: false
});
const separator = '<<<sep>>>'; // has to be unique

/**
 *
 * @param {string} hash_name
 * @param {string} key_name
 * @returns {string}
 */
const getRepresentativeName = (hash_name, key_name) => {
  return `START_HASH_KEY_EXPIRE_REPRESENTATIVE::${hash_name}${separator}${key_name}::END_HASH_KEY_EXPIRE_REPRESENTATIVE`;
};

/**
 *
 * @param {string} key
 * @returns {*}
 */
const getHashNameFromRepresentative = (key) => {
  let hash_name = null;
  
  try {
    hash_name = key.split('START_HASH_KEY_EXPIRE_REPRESENTATIVE::')[1].split('::END_HASH_KEY_EXPIRE_REPRESENTATIVE')[0].split(separator)[0];
  }
  catch (e) {
    console.error(e.stack);
  }
  
  return hash_name;
};

/**
 *
 * @param {string} key
 * @returns {*}
 */
const getKeyNameFromRepresentative = (key) => {
  let key_name = null;
  
  try {
    key_name = key.split('START_HASH_KEY_EXPIRE_REPRESENTATIVE::')[1].split('::END_HASH_KEY_EXPIRE_REPRESENTATIVE')[0].split(separator)[1];
  }
  catch (e) {
    console.error(e.stack);
  }
  
  return key_name;
};

/**
 * @this RedisWrapper
 * @param params
 * @param {string} params.hash_name
 * @param {object[]} params.key_names - key_names [jovin, jesus, mwilanga]
 * @param {number} params.max_life_seconds
 * @returns {Promise.<object[]>}  - an array of zadd commands
 */
const prepareHashKeyExpireRepresentative = function (params) {
  const self = this;
  
  const schema = {
    type                : 'object',
    required            : ['hash_name', 'key_names', 'max_life_seconds'],
    additionalProperties: false,
    properties          : {
      hash_name       : {
        type: 'string'
      },
      key_names       : {
        type    : 'array',
        minItems: 1,
        items   : {
          type: 'string'
        }
      },
      max_life_seconds: {
        type: 'integer'
      }
    }
  };
  
  const validate = ajv.compile(schema);
  const valid    = validate(params);
  
  if (!valid) {
    const e = new Error(ajv.errorsText(validate.errors));
    
    e.ajv = validate.errors;
    throw e;
  }
  
  const {
          hash_name,
          key_names,
          max_life_seconds
        } = params;
  
  const score         = Date.now() + (max_life_seconds * 1000);
  const zadd_commands = [];
  
  key_names.map(key_name => {
    
    const command = [
      'zadd',
      self.bins.hash_keys_expire,
      score,
      getRepresentativeName(hash_name, key_name)
    ];
    
    zadd_commands.push(command);
    
    return true;
    
  });
  
  return BPromise.resolve(zadd_commands);
};

/**
 * @this RedisWrapper
 * @returns {*}
 */
const removeExpiredHashKeys = function () {
  const self           = this;
  const client         = self.client;
  const now            = Date.now();
  const multi_commands = [];
  
  return self.rzrangebyscore({
    set_name            : self.bins.hash_keys_expire,
    min_score           : 0,
    max_score           : now,
    should_be_registered: false
  })
    .then(d => {
      
      let expired_keys = [];
      
      if (d && d.length > 0) {
        expired_keys = d;
      }
      
      expired_keys.map(key => {
        
        const hash_name = getHashNameFromRepresentative(key);
        const key_name  = getKeyNameFromRepresentative(key);
        
        if (!hash_name || !key_name) {
          console.warn(`Failed to resolve the hash_name and (or) key_name of ${key}. Skipping`);
          
          return [];
        }
        
        multi_commands.push([
          'hdel',
          hash_name,
          key_name
        ]);
        
        return expired_keys;
        
      });
      
      expired_keys.map(key => {
        
        multi_commands.push([
          'zrem',
          self.bins.hash_keys_expire,
          key
        ]);
        
        return true;
        
      });
      
      return client.multi(multi_commands)
        .exec();
      
    });
};

exports.getRepresentativeName              = getRepresentativeName;
exports.prepareHashKeyExpireRepresentative = prepareHashKeyExpireRepresentative;
exports.removeExpiredHashKeys              = removeExpiredHashKeys;