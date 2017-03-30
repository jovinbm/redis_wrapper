/**
 * @this RedisWrapper
 * @returns {*}
 */
module.exports = function () {
  const self   = this;
  const client = self.client;
  
  return client.flushdb();
};