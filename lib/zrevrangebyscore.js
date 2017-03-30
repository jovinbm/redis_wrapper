const ajv = require('ajv')({
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
 * Returns all the elements in the sorted set at key with a score between min_score and max_score (including elements with score
 * equal to min_score or max_score). The elements are considered to be ordered from low to high scores.
 * @this RedisWrapper
 * @param {object} params
 * @param {string} params.set_name
 * @param {number} params.max_score  - can bet -Infinity|Infinity
 * @param {number} params.min_score  - can bet -Infinity|Infinity
 * @param {boolean} [params.with_scores]
 * @param {object} [params.limit]
 * @param {number} [params.limit.count]
 * @param {number} [params.limit.offset]
 * @param {boolean} [params.should_be_registered=false] - if key should be registered in global registered keys
 * @returns {Promise.<object[]>} e.g. with_scores: false => [jovin,jesus], with_scores: true => [jovin,100,jesus,200]
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
          with_scores,
          limit,
          should_be_registered = false
        }                      = params;
  
  if (!should_be_registered) {
    if (!self.validateKey(set_name)) {
      throw new Error('Validate key failed');
    }
  }
  
  const args = [set_name, max_score, min_score];
  
  if (with_scores) {
    args.push('WITHSCORES');
  }
  
  if (limit) {
    args.push('LIMIT');
    args.push(limit.offset);
    args.push(limit.count);
  }
  
  return client.zrevrangebyscore(args);
  
};