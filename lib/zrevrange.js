const BPromise = require('bluebird');
const ajv      = require('ajv')({
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
 * from the highest to the lowest score". Descending lexicographical order is used for elements with equal score. Apart
 * from the reversed ordering, ZREVRANGE is similar to ZRANGE.
 * @this RedisWrapper
 * @param {object} params
 * @param {string} params.set_name
 * @param {number} params.start_index - start_index index, zero based index
 * @param {number} params.stop_index  - end index, zero based index
 * @param {boolean} [params.with_scores]
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
          with_scores,
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
      
      const args = [set_name, start_index, stop_index];
      
      if (with_scores) {
        args.push('WITHSCORES');
      }
      
      return client.zrevrange(args);
    });
};