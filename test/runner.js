define(function (require, exports) {
  'use strict';
  var stuff = require('lib/stuff')
    , assert = require('vendor/assert');

  var path = 'http://localhost:8888/index.html';

  exports.init = function () {
    describe('Stuff', function () {
      it('should create iframe', function (done) {
        stuff(path, function (context) {
          assert.ok(context);
          done();
        });
      });

      it('should clear all iframes', function (done) {
        // create one more.
        stuff(path, function (context) {
          assert.equal(document.querySelectorAll('iframe').length, 2);
          stuff.clear();
          assert.equal(document.querySelectorAll('iframe').length, 0);
          done();
        });
      });
    });

    describe('Context', function () {
      var context;
      before(function (done) {
         stuff(path, function (c) {
            context = c;
            done();
         });
      });

      it('should load some html', function (done) {
        var testHtml = '<html><body>wat</body></html>'
        context.load(testHtml, function () {
          done();
        });
      });

    });
  };

});
