var RedisWrapper = require('./index');

var config = {
  validateKey: function () {
    return true;
  },
  host       : '127.0.0.1',
  port       : 6379,
  db_number  : 0
};

var RedisWrapperInstance = new RedisWrapper(config);

RedisWrapperInstance._mset({
  args                : {
    key_name: 'jovin',
    data    : 'jovin',
  },
  overwrite           : true,
  max_life_seconds    : 1000 * 3600,
  should_be_registered: false
});