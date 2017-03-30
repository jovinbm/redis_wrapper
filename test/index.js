const tape                 = require('tape');
const RedisWrapper         = require('../index');
const config               = {
  host     : 'localhost',
  port     : 4020,
  db_number: 15,
  password : 'a',
  validateKey(){
    return true;
  }
};
const redis                = new RedisWrapper(config);
const should_be_registered = true;

const down = () => redis.rflushdb();
const up   = () => {
  
  return redis.rmset({
    args     : {
      test_key1 : 'test_key1',
      test_key2 : 'test_key2',
      test_key3 : 'test_key3',
      test_key4 : 'test_key4',
      test_key5 : 'test_key5',
      test_key6 : 'test_key6',
      test_key7 : 'test_key7',
      test_key8 : 'test_key8',
      test_key9 : 'test_key9',
      test_key10: 'test_key10'
    },
    overwrite: true,
    should_be_registered
  })
    .then(() => {
      
      return redis.rhmset({
        hash_name: 'test_hash_1',
        args     : {
          test_key1 : 'test_key1',
          test_key2 : 'test_key2',
          test_key3 : 'test_key3',
          test_key4 : 'test_key4',
          test_key5 : 'test_key5',
          test_key6 : 'test_key6',
          test_key7 : 'test_key7',
          test_key8 : 'test_key8',
          test_key9 : 'test_key9',
          test_key10: 'test_key10'
        },
        overwrite: true,
        should_be_registered
      });
      
    });
  
};

tape.onFinish(() => {
  redis.client.disconnect();
});

exports.redis  = redis;
exports.up     = up;
exports.down   = down;
exports.downUp = () => down().then(up);
exports.upDown = () => up().then(down);