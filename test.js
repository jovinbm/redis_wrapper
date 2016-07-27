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

RedisWrapperInstance._hmset({
  hash_name           : 'names',
  args                : {
    first: 'JovinC',
    last : 'Mwilanga'
  },
  overwrite           : true,
  should_be_registered: false
});