/**
 * Created by justlogin on 10/21/14.
 */

var request = require('request'),
  async = require('async'),
  fs = require('fs'),
  utils = require('../utils'),
  session = require('../session-data');


/**
 * Uploads file to the storage. If additional headers are needed, the can be passed with 'additionalHeaders' parameter.
 * @param {String} fullLocalPath
 * @param {String} fullHostingPath
 * @param {Function} callback
 * @param {Object} [additionalHeaders]
 */
module.exports = function (fullLocalPath, fullHostingPath, callback, additionalHeaders) {
  async.waterfall(
    [
      function(wfCb) {
        fs.readFile(fullLocalPath, wfCb);
      },
      function(file, wfCb) {
        var req = {
          url: session.xUrl + fullHostingPath,
          method: 'PUT',
          headers: {
            'X-Auth-Token': session.authToken,
            'Content-Length': fs.statSync(fullLocalPath).size
          },
          body: file
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