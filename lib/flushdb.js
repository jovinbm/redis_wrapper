var BPromise = require('bluebird');

module.exports = function (RedisWrapper) {
  
  RedisWrapper.prototype._flushdb = function () {
    var self   = this;
    var client = self.client;
    
    return BPromise.resolve()
      .then(function () {
        console.warn("!######### START: FLUSHING REDIS DB ###########!");
        return client.flushdb();
      })
      .tap(function () {
        console.warn("!######### END:   FLUSHING REDIS DB ###########!");
        return true;
      });
  };
};