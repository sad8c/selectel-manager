/**
 * Created by justlogin on 10/22/14.
 */

var request = require('request'),
  session = require('../session-data');


/**
 * Returns files list of the selected container. If additional parameters are needed, the can be passed with
 * 'additionalParameters' parameter.
 * @param {String} containerPath Path to container without URL
 * @param {Function} callback
 * @param {Object} [additionalParameters]
 */
module.exports = function(containerPath, callback, additionalParameters) {
  request(
    {
      url: session.xUrl + containerPath,
      method: 'GET',
      headers: {'X-Auth-Token': session.authToken},
      qs: additionalParameters
    },
    function(err, data) {
      if (err || !data) {
        callback(err, {success: false});
      } else {
        if (data.statusCode == 200) {
          callback(null, {
            success: true,
            files: data.body
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