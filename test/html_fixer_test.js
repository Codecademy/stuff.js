define(function (require, exports) {
  'use strict';

  var htmlFixer  = require('lib/html_fixer')
    , assert     = require('vendor/assert');

  exports.init = function () {
    var full = '<!DOCTYPE html><html><head></head><body></body></html>';
    it('should add doctype, html, head, and body to an empty doc', function () {
      assert.equal(htmlFixer('', {}, []), full);
    });

    it('should add doctype to a doc', function () {
      assert.equal(htmlFixer('<html><head></head><body></body></html>'), full);
    });

    it('should add html to a doc', function () {
      assert.equal(htmlFixer('<!DOCTYPE html><head></head><body></body>'), full);
    });

    it('should add body to a doc', function () {
      assert.equal(htmlFixer('<!DOCTYPE html><html><head></head></html>'), full);
    });

    it('should add head to a doc', function () {
      assert.equal(htmlFixer('<!DOCTYPE html><html><body></body></html>'), full);
    });

    it('should handle unclosed tags and unopened tags', function () {
      assert.equal(htmlFixer('<!DOCTYPE html><html></body>', {}, []), full);
    });

    it('It should wrap elements (h2) with body if missing ', function () {
      assert.equal(
        htmlFixer('<!DOCTYPE html><html><head></head><h2></h2></html>', {}, [])
      , full.replace('<body>', '<body><h2></h2>')
      );
    });

    it('should inline scripts, styles', function () {
      var source   = '<!DOCTYPE html><html><head><script src="foo.js"></script>'
                   + '<link href="foo/bar.css" media="screen" rel="stylesheet" type="text/css" />'
                   + '</head><body><script src="bar.js"></script></body></html>';
      var expected = '<!DOCTYPE html><html><head><script>foojavascript</script><style>SOMEKICKASSCSS</style></head>'
                   + '<body><script>barjavascript</script></body></html>';

      var result = htmlFixer({
        HTML: source
      , includes: {
          JS  : { 'foo.js': 'foojavascript', 'bar.js': 'barjavascript' }
        , CSS : { 'foo/bar.css': 'SOMEKICKASSCSS' }
        }
      });

      assert.equal(result, expected);
    });

    it('should inject scripts', function () {
      var expected = '<!DOCTYPE html><html><head><script src="foo.js"></script>'
                    + '<script src="bar.js"></script></head><body></body></html>';
      var result = htmlFixer({
        HTML: '<!DOCTYPE html><html><head></head><body></body></html>'
      , external: {
          JS  : ['foo.js', 'bar.js']
        }
      });
      assert.equal(result, expected);
    });
  };

});