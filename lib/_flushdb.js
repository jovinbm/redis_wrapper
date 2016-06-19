module.exports = function (Redis_wrapper) {
  
  var Promise = require('bluebird');
  
  Redis_wrapper.prototype._flushdb = function () {
    var redis_client = Redis_wrapper.redis_client;
    
    return Promise.resolve()
      .then(function () {
        console.log("!######### START: FLUSHING REDIS DB ###########!");
        return redis_client.flushdbAsync();
      })
      .tap(function () {
        console.log("!######### END:   FLUSHING REDIS DB ###########!");
        return true;
      });
  };
};