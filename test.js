var qs                 = require('qs');
var _                  = require('underscore');
var start_identifier   = '$$START_METADATA$$';
var end_identifier     = '$$END_METADATA$$';
var metadata_separator = '$$sep$$';

var tag_names = ['html_main', 'html_mini', 'main'];
var ids       = [1, 10, 105];
var pages     = [1, 6];

// function gen(key) {
//   var obj = {
//     key         : key,
//     id          : _.shuffle(ids)[0],
//     key_tag_name: _.shuffle(tag_names)[0],
//     page        : _.shuffle(pages)[0],
//   };
//   var k   = qs.stringify(obj, {delimiter: metadata_separator});
//   return `${start_identifier}${k}${end_identifier}`;
// }

var RedisWrapper = require('./index');

var config = {
  validateKey: function () {
    return true;
  },
  host       : '127.0.0.1',
  port       : 6379,
  db_number  : 2
};

var RedisWrapperInstance = new RedisWrapper(config);

// var sample_data = {};
// require('./sample.json').map(function (d) {
//   sample_data[gen(d.last_name)] = d.last_name;
// });

//RedisWrapperInstance._hmset({
//  hash_name           : 'sample',
//  args                : sample_data,
//  overwrite           : true,
//  max_life_seconds    : 1000 * 3600,
//  should_be_registered: false
//});

RedisWrapperInstance._hscan({
  hash_name           : 'item_cache_bin',
  match_pattern       : '$$START_METADATA$$key=page_article$$sep$$id=7840$$sep$$page=1$$sep$$version=*$$sep$$key_tag_name=html_main$$END_METADATA$$',
  count               : 2000,
  should_be_registered: false
})
  .then(function (d) {
    console.log(d);
  });
