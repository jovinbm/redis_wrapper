const ajv = require('ajv')({
  removeAdditional: true
});

const schema = {
  type                : 'object',
  required            : ['set_name', 'start_index', 'stop_index'],
  additionalProperties: false,
  properties          : {
    set_name            : {
      type     : 'string',
      minLength: 1
    },
    start_index         : {
      type: 'number'
    },
    stop_index          : {
      type: 'number'
    },
    with_scores         : {
      type: 'boolean'
    },
    should_be_registered: {
      type: 'boolean'
    }
  }
};

const validate = ajv.compile(schema);

/**
 * Returns the specified range of elements in the sorted set stored at key. The elements are considered to be "ordered
 * from the lowest to the highest score". Lexicographical order is used for elements with equal score.
 * Returns the specified range of elements in the sorted set stored at key: start_index and stop_index are inclusive
 * ranges
 * Both start and stop are zero-based indexes, where 0 is the first element, 1 is the next element and so on.
 * They can also be negative numbers indicating offsets from the end of the sorted set,
 * with -1 being the last element of the sorted set, -2 the penultimate element and so on.
 * e.g to get all use start_index: 0, stop_index: -1 = last
 * @this RedisWrapper
 * @param {object} params
 * @param {string} params.set_name
 * @param {number} params.start_index - start_index index, zero based index
 * @param {number} params.stop_index  - end index, zero based index
 * @param {boolean} [params.with_scores=false]
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
          start_index,
          stop_index,
          with_scores          = false,
          should_be_registered = false
        }                      = params;
  
  if (!should_be_registered) {
    if (!self.validateKey(set_name)) {
      throw new Error('Validate key failed');
    }
  }
  
  const args = [set_name, start_index, stop_index];
  
  if (with_scores) {
    args.push('WITHSCORES');
  }
  
  return client.zrange(args);
};