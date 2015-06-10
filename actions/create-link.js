/**
 * Created by justlogin on 10/21/14.
 */

var request = require('request'),
  utils = require('../utils'),
  session = require('../session-data');


/**
 * Creates a public link to a file. If additional headers are needed, the can be passed with 'additionalHeaders'
 * parameter.
 *
 * @param {String} filePath Path to file without X-URL
 *
 * @param {String} linkPath Path to link without X-URL
 *
 * @param {String} linkType
 * 'x-storage/symlink' - simple link,
 * 'x-storage/onetime-symlink' - one-time link
 * 'x-storage/symlink+secure' simple password-protected link
 * 'x-storage/onetime-symlink+secure' - one-time password-protected link
 * Warning! These types may change. Take a look on Selectel official docs!
 *
 * @param {Function} callback
 *
 * @param {Object} [additionalHeaders]
 */
module.exports = function(filePath, linkPath, linkType, callback, additionalHeaders) {
  var fullLink = session.xUrl + linkPath,
    req = {
    url: fullLink,
    method: 'PUT',
    headers: {
      'X-Auth-Token': session.authToken,
      'X-Object-Meta-Location': filePath,
      'Content-Type': linkType,
      'Content-Length': 0
    }};

  utils.copyHeaders(req, additionalHeaders);

  request(req, function(err, data) {
    if (err || !data) {
      callback(err, {success: false});
    } else {
      if (data.statusCode == 201) {
        callback(null, {
          success: true,
          link: fullLink.replace('https:', 'http:').replace('.ru', '.com')
        });
      } else {
        callback(null, {
          success: false,
          selectelMessage: data.body
        });
      }
    }
  });
};