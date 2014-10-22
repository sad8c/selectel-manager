/**
 * Created by justlogin on 10/21/14.
 */

var index = require('./actions/index'),
  async = require('async');


async.series([
  function(seriesCb) {
    index.authorize('36599_test2', 'P68PtkwkW4', seriesCb);
  },
  function(seriesCb) {
    index.getContainerFiles(
      'test-records/', function(err, data) {
        console.log(err, data);
      }, {format: 'json'}
    );
  }
], function(){});
