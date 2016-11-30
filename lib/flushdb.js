const BPromise = require('bluebird');

/**
 * @this RedisWrapper
 * @returns {*}
 */
module.exports = function () {
  const self   = this;
  const client = self.client;
  
  return BPromise.resolve()
    .then(function () {
      console.warn('!######### START: FLUSHING REDIS DB ###########!');
      
      return client.flushdb();
    });
};