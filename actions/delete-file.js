/**
 * Created by justlogin on 10/22/14.
 */

var request = require('request'),
  session = require('../session-data');


/**
 * @param {String} filePath Path to file without URL
 * @param {Function} callback
 */
module.exports = function(filePath, callback) {
  request(
    {
      url: session.xUrl + filePath,
      method: 'DELETE',
      headers: {'X-Auth-Token': session.authToken}
    },
    function(err, data) {
    if (err || !data) {
      callback(err, {success: false});
    } else {
      if (data.statusCode == 204) {
        callback(null, {success: true});
      } else {
        callback(null, {
          success: false,
          selectelMessage: data.body
        });
      }
    }
  });
};