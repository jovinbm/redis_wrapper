var BPromise = require('bluebird');

/**
 *
 * @param {function|Promise} predicate - a function, a function that returns a Promise, or a Promise
 * @param {function|Promise} action - a function, a function that returns a Promise, or a Promise
 * @param {*} value
 * @returns {Promise.<*>}
 */
function promiseWhile(predicate, action, value) {
  return BPromise.resolve(value)
    .then(predicate)
    .then(function (condition) {
      if (condition) {
        return promiseWhile(predicate, action, action());
      }
    });
}

exports.promiseWhile = promiseWhile;