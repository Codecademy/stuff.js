define(function (require, exports, module) {
  'use strict';
  var htmlFixerTest = require('test/html_fixer_test');

  exports.init = function () {
    describe('htmlFixer', htmlFixerTest.init);
  };

});
