/**
 * Copyright (C) 2013 Cat, LLC
 */

var path = require('path'),
    async = require('async'),
    unirest = require('unirest'),
    fs = require('fs'),

    MS_IN_MIN = 60 * 1000,


    tempUrl,
    requiredHeaders,
    useCutting;

/**
 * Connects to hosting, remembering temporary link and token.
 * @param {String} login
 * @param {String} pass
 * @param {String} host
 * @param {Boolean} cut
 * @param {function} errorCallback
 * @param {function} successCallback
 */
exports.connect = function (login, pass, host, cut, successCallback, errorCallback) {
    useCutting = cut;

    unirest
        .get(host)
        .headers({
            'X-Auth-User': login,
            'X-Auth-Key': pass
        })
        .end(function (resp) {
            if (resp.headers && resp.headers['x-storage-url'] && resp.headers['x-auth-token']) {
                tempUrl = resp.headers['x-storage-url'];
                requiredHeaders = { 'x-auth-token': resp.headers['x-auth-token'] };

                successCallback(cutOffRespData(resp));
            } else {
                errorCallback(cutOffRespData(resp));
            }
        }
    );
};

/**
 * Deletes all passed files from hosting.
 * @param {Array} files array of full pathes to uploading files
 * @param {function} successCallback
 * @param {function} errorCallback
 */
exports.deleteFiles = function (files, successCallback, errorCallback) {
    async.map(
        files,
        function (file, innerCb) {
            unirest
                .delete(tempUrl + file)
                .headers(requiredHeaders)
                .end(function (resp) {
                    innerCb(
                        null,
                        {
                            resp: resp,
                            file: file
                        }
                    );
                }
            );
        },
        function (err, data) {
            var respData = {};

            for (var i = 0; i < files.length; i++) {
                var found = false,
                    deleted = false;

                for (var j = 0; j < data.length; j++) {
                    if (files[i] == data[j].file) {
                        found = true;

                        if (data[j].resp.code == 204) {
                            deleted = true;
                        }

                        break;
                    }
                }

                if (deleted) { //file deleted successfully
                    if (!respData.deleted) {
                        respData.deleted = [];
                    }

                    respData.deleted.push(files[i]);
                } else { //file was not deleted
                    if (!respData.undeleted) {
                        respData.undeleted = [];
                    }

                    if (found) { //there is the response from hosting on DELETE request
                        respData.undeleted.push({
                            file: data[j].file,
                            resp: cutOffRespData(data[j].resp)
                        });
                    } else { //there is no response from hosting on DELETE request
                        respData.undeleted.push(files[i]);
                    }
                }
            }

            if (respData.undeleted) {
                errorCallback(respData);
            } else {
                successCallback(respData);
            }

        }
    );
};

/**
 * Makes list of files, uploaded to all passed directories.
 * @param {Array} dirs
 * @param {function} successCallback
 * @param {function} errorCallback
 */
exports.makeFilelist = function (dirs, successCallback, errorCallback) {
    async.map(
        dirs,
        function (service, innerCb) {
            unirest
                .get(tempUrl + service)
                .headers(requiredHeaders)
                .end(function (resp) {
                    innerCb(
                        null,
                        {
                            resp: resp,
                            obj: service
                        }
                    );
                }
            );
        },
        function (err, data) {
            var respObj = {};

            for (var i = 0; i < data.length; i++) {
                if (data[i].resp.code == 200 || data[i].resp.code == 204) {
                    if (data[i].resp.raw_body != '') {
                        if (!respObj.filelist) {
                            respObj.filelist = [];
                        }

                        var ar = data[i].resp.raw_body.split('\n'),
                            ln = ar.length - 1;

                        for (var j = 0; j < ln; j++) {
                            respObj.filelist.push({
                                filename: ar[j],
                                containername: data[i].obj
                            });
                        }
                    }
                } else {
                    if (!respObj.containerErrors) {
                        respObj.containerErrors = [];
                    }

                    respObj.containerErrors.push({
                        containername: data[i].obj,
                        error: cutOffRespData(data[i].resp)
                    });
                }
            }

            if (respObj.containerErrors) {
                errorCallback(respObj);
            } else {
                successCallback(respObj);
            }
        }
    );
};

/**
 * Opens public access to file for some ammount of time.
 * @param {String} fullFilePath full path to file
 * @param {String} fullLinkPath
 * @param {Number} accessTime public link lifetime in minutes (Selectel's smallest time unit)
 * @param {function} successCallback
 * @param {function} errorCallback
 */
exports.createPublicLink = function (fullFilePath, fullLinkPath, accessTime, successCallback, errorCallback) {
    var headers = copyRequiredHeaders();
    headers['X-Object-Meta-Location'] = tempUrl + fullFilePath;
    headers['X-Object-Meta-Delete-At'] = Number(new Date()) + MS_IN_MIN * accessTime;
    headers['Content-Type'] = 'x-storage/symlink';
    headers['Content-Length'] = 0;

    unirest
        .put(tempUrl + fullLinkPath)
        .headers(requiredHeaders)
        .end(function (resp) {
            var respObj = {
                resp: cutOffRespData(resp),
                fullFilePath: fullFilePath,
                fullLinkPath: fullLinkPath
            };

            if (resp.code == 201) {
                successCallback(respObj);
            } else {
                errorCallback(respObj);
            }

        }
    );
};

/**
 * Uploads file to hosting.
 * @param {String} fullLocalPath full path to file
 * @param {String} fullHostingPath full new path on hosting to file
 * @param {function} successCallback
 * @param {function} errorCallback
 */
exports.uploadFile = function (fullLocalPath, fullHostingPath, successCallback, errorCallback) {
    var headers = copyRequiredHeaders();
    headers['Content-Lenght'] = fs.statSync(fullLocalPath).size;

    unirest
        .put(tempUrl + fullHostingPath)
        .headers(requiredHeaders)
        .end(function (resp) {
            var callbackObj = {
                resp: cutOffRespData(resp),
                fullLocalPath: fullLocalPath,
                fullHostingPath: fullHostingPath
            };

            if (resp.code == 201) {
                successCallback(callbackObj);
            } else {
                errorCallback(callbackObj);
            }
        }
    );
};

/**
 * Cutting off some "useless" fields from HTTP response.
 * @param {Object} resp HTTP response
 * @returns {Object}
 */
function cutOffRespData(resp) {
    if (!useCutting) {
        return resp;
    }

    var uselessHeaders = [
            "content-length",
            "content-type",
            "access-control-allow-origin",
            "access-control-expose-headers"
        ],
        headers = {};

    for (var header in resp.headers) {
        if (uselessHeaders.indexOf(header) == -1 && resp.headers.hasOwnProperty(header)) {
            headers[header] = resp.headers[header];
        }
    }

    return {
        code: resp.code,
        headers: headers,
        body: resp.body
    }
}

/**
 * Copies all requiered headers to new object (by this moment, the only required header is Token).
 * @returns {Object}
 */
function copyRequiredHeaders() {
    var headers = {};

    for (var header in requiredHeaders) {
        if (requiredHeaders.hasOwnProperty(header)) {
            headers[header] = requiredHeaders[header];
        }
    }

    return headers;
}