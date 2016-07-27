var BPromise = require('bluebird');
var path     = require('path');
var fs       = require('fs');
var fileName = path.basename(__filename);
BPromise.promisifyAll(require('fs'));

module.exports = function (RedisWrapper) {
  
  var normalizedPath = path.join(__dirname);
  var excludeFiles   = [fileName];
  
  fs.readdirSync(normalizedPath).forEach(function (fileNameWithExt) {
    if (excludeFiles.indexOf(fileNameWithExt) > -1) {
      return true;
    }
    if (fs.statSync(path.join(normalizedPath, fileNameWithExt)).isFile()) {
      require("./" + fileNameWithExt)(RedisWrapper);
    }
    else {
      require("./" + fileNameWithExt + '/index.js')(RedisWrapper);
    }
  });
};