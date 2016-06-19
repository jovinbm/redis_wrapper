module.exports = function (Redis_wrapper) {

  var Promise = require('bluebird');
  var path    = require('path');
  var fs      = require('fs');
  Promise.promisifyAll(require('fs'));
  var fileName = path.basename(__filename);

  var normalizedPath = path.join(__dirname);
  var excludeFiles   = [fileName];
  fs.readdirSync(normalizedPath).forEach(function (fileNameWithExt) {
    if (excludeFiles.indexOf(fileNameWithExt) > -1) {
      return true;
    }
    if (fs.statSync(path.join(normalizedPath, fileNameWithExt)).isFile()) {
      require("./" + fileNameWithExt)(Redis_wrapper);
    }
    else {
      require("./" + fileNameWithExt + '/index.js')(Redis_wrapper);
    }
  });
};