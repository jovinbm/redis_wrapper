const BPromise = require('bluebird');
const ajv      = require('ajv')({
  removeAdditional: true
});

const schema = {
  type                : 'object',
  required            : ['set_name', 'max_score', 'min_score'],
  additionalProperties: false,
  properties          : {
    set_name            : {
      type     : 'string',
      minLength: 1
    },
    max_score           : {
      type: 'number'
    },
    min_score           : {
      type: 'number'
    },
    with_scores         : {
      type: 'boolean'
    },
    limit               : {
      type                : 'object',
      required            : ['offset', 'count'],
      additionalProperties: false,
      properties          : {
        count : {
          type   : 'integer',
          minimum: 1
        },
        offset: {
          type   : 'integer',
          minimum: 0
        }
      }
    },
    should_be_registered: {
      type: 'boolean'
    }
  }
};

const validate = ajv.compile(schema);

/**
 * Removes all elements in the sorted set stored at key with a score between min and max (inclusive).
 * @this RedisWrapper
 * @param {object} params
 * @param {string} params.set_name
 * @param {number} params.max_score - inclusive
 * @param {number} params.min_score - inclusive
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
          max_score,
          min_score,
          should_be_registered = false
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
      
      const args = [set_name, min_score, max_score];
      
      return client.zremrangebyscore(args);
    });
};