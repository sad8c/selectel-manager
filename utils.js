/**
 * Created by justlogin on 10/21/14.
 */


/**
 * Copies all headers into the passed request object.
 * @param {Object} req
 * @param {Object} headers
 */
exports.copyHeaders = function(req, headers) {
  for (var fieldName in headers) {
    req.headers[fieldName] = headers.fieldName;
  }
};