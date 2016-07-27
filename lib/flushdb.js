var BPromise = require('bluebird');

module.exports = function (RedisWrapper) {
  
  RedisWrapper.prototype._flushdb = function () {
    var self         = this;
    var redis_client = self.redis_client;
    
    return BPromise.resolve()
      .then(function () {
        console.warn("!######### START: FLUSHING REDIS DB ###########!");
        return redis_client.flushdbAsync();
      })
      .tap(function () {
        console.warn("!######### END:   FLUSHING REDIS DB ###########!");
        return true;
      });
  };
};