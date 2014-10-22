/**
 * Created by justlogin on 10/21/14.
 */

var request = require('request'),
  session = require('../session-data');


/**
 * Tries to authorize in Selectel storage, using passed login-password combination. Returns 'x-auth-token',
 * 'x-storage-token', 'x-storage-url' and 'x-expire-auth-token' headers if not fails. This function will also remember
 * your session data (which is used in every another request) until you call it successfully again.
 * @param {String} login
 * @param {String} pass
 * @param {Function} callback
 */
module.exports = function(login, pass, callback) {
  request(
    {
      url: 'https://auth.selcdn.ru/',
      headers: {
        'X-Auth-User': login,
        'X-Auth-Key': pass
      }
    },
    function(err, data) {
      if (err) {
        callback(err, {success: false});
      } else {
        if (data.statusCode == 204) {
          session.authToken = data.headers['x-auth-token'];
          session.xUrl = data.headers['x-storage-url'];

          callback(
            err,
            {
              success: true,
              authToken: data.headers['x-auth-token'],
              storageToken: data.headers['x-storage-token'],
              xUrl: data.headers['x-storage-url'],
              expirationTime: parseInt(data.headers['x-expire-auth-token'])
            }
          );
        } else {
          callback(
            err,
            {
              success: false,
              selectelMessage: data.body
            }
          );
        }
      }
    }
  );
};