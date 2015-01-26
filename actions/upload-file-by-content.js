/**
 * Created by justlogin on 22/01/15.
 */

var request = require('request'),
  async = require('async'),
  utils = require('../utils'),
  session = require('../session-data');


/**
 * Works exactly like "upload-file", but takes file content (not file path!) as the first argument.
 * @param {*} content
 * @param {String} hostingPath path without URL
 * @param {Function} callback
 * @param {Object} [additionalHeaders]
 */
module.exports = function (content, hostingPath, callback, additionalHeaders) {
  async.waterfall(
    [
      function(wfCb) {
        var req = {
          url: session.xUrl + hostingPath,
          method: 'PUT',
          headers: {
            'X-Auth-Token': session.authToken,
            'Content-Length': content.length
          },
          body: content
        };
        utils.copyHeaders(req, additionalHeaders);

        request(req, wfCb);
      }
    ],
    function(err, data) {
      if (err || !data) {
        callback(err, {success: false});
      } else {
        if (data.statusCode == 201) {
          callback(null, {success: true});
        } else {
          callback(null, {
            success: false,
            selectelMessage: data.body
          });
        }
      }
    }
  );
};