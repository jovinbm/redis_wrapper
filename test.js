var qs                 = require('qs');
var _                  = require('underscore');
var start_identifier   = '$$START_METADATA$$';
var end_identifier     = '$$END_METADATA$$';
var metadata_separator = '$$sep$$';

var tag_names = ['html_main', 'html_mini', 'main'];
var ids       = [1, 10, 105];
var pages     = [1, 6];

function gen(key) {
  var obj = {
    key         : key,
    id          : _.shuffle(ids)[0],
    key_tag_name: _.shuffle(tag_names)[0],
    page        : _.shuffle(pages)[0],
  };
  var k   = qs.stringify(obj, {delimiter: metadata_separator});
  return `${start_identifier}${k}${end_identifier}`;
}

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
var redis_client         = RedisWrapperInstance.redis_client;

var sample_data = {};
require('./sample.json').map(function (d) {
  sample_data[gen(d.last_name)] = d.last_name;
});

//RedisWrapperInstance._hmset({
//  hash_name           : 'sample',
//  args                : sample_data,
//  overwrite           : true,
//  max_life_seconds    : 1000 * 3600,
//  should_be_registered: false
//});

var command2 = [
  'hscan',
  'sample',
  0,
  'MATCH',
  '$$START_METADATA$$key=Weaver$$sep$$id=*$$sep$$key_tag_name=*$$sep$$page=*$$END_METADATA$$',
  'COUNT',
  3000
];

var cursor    = 0;
var hash_data = {};

redis_client.multi([
  command2
])
  .execAsync()
  .then(function (d) {
    cursor = d[0][0];
    
    var data = d[0][1];
    
    data.map(function (k, i) {
      if (i % 2 !== 0) {
        // key starts at 0,
        // even keys are values, 0 and other odd keys are hash_keys
        return;
      }
      
      hash_data[k] = data[i + 1];
    });
  })
  .then(function () {
    console.log(cursor);
    console.log(hash_data);
  });