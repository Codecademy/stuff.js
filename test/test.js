(function () {
  'use strict';

  var stuff  = window.stuff
    , assert = window.assert;

  var path = '/secure/index.html'
    , sameOriginPath = '/secure/index.html';

  describe('Stuff', function () {
    it('should create iframe', function (done) {
      stuff(path, function (context) {
        assert.ok(context);
        done();
      });
    });

    it('should append iframe to a custom element', function (done) {
      var div = document.createElement('div');
      document.body.appendChild(div);
      stuff(path, div, function () {
        assert.equal(div.querySelectorAll('iframe').length, 1);
        done();
      });
    });

    var sandboxSupported = 'sandbox' in document.createElement('iframe');

    it('should not add the sandbox property unless specified', function (done) {
      stuff(sameOriginPath, function (context) {
        context.load('something nice', function () {
          assert.ok(
            !context.iframe.contentDocument.querySelector('iframe').getAttribute('sandbox')
          );
          done();
        });
      });
    });

    it('should add the iframe sandbox property', function (done) {
      stuff(sameOriginPath, { sandbox: true }, function (context) {
        context.load('something nice', function () {
          assert.equal(
            context.iframe.contentDocument.querySelector('iframe').getAttribute('sandbox')
          , 'allow-scripts allow-same-origin'
          );
          if (sandboxSupported) {
            context.evaljs('window.parent.location.hash = "bar"', function () {
              assert.notEqual(location.hash, '#bar');
              done();
            });
          } else {
            done();
          }
        });
      });
    });

    it('should allow custom flags in sandbox property', function (done) {
      stuff(sameOriginPath, { sandbox: 'allow-top-navigation' }, function (context) {
        context.load('something aweful', function () {
          assert.equal(
            context.iframe.contentDocument.querySelector('iframe').getAttribute('sandbox')
          , 'allow-top-navigation allow-scripts allow-same-origin'
          );
          if (sandboxSupported) {
            context.evaljs('window.top.location.hash = "foo"', function () {
              assert.equal(location.hash, '#foo');
              location.hash = '';
              done();
            });
          } else {
            done();
          }
        });
      });
    });

    it('should clear all iframes', function (done) {
      // create one more.
      stuff(path, function () {
        assert.equal(document.querySelectorAll('iframe').length, 6);
        stuff.clear();
        assert.equal(document.querySelectorAll('iframe').length, 0);
        done();
      });
    });

  });

  describe('Context', function () {
    var testHtml = '<html><head></head><body>wat</body></html>'
      , context;

    before(function (done) {
       stuff(path, function (c) {
          context = c;
          done();
       });
    });

    describe('#load', function () {
      it('should load some html', function (done) {
        context.load(testHtml, function () {
          done();
        });
      });
    });

    describe('#html', function () {
      it('should should tell it\'s html', function (done) {
        context.html(function (html) {
          assert.equal(html, testHtml);
          done();
        });
      });
    });

    describe('#evaljs', function () {
      it('should do basic js eval', function (done) {
        context.evaljs('1+1', function (e, res) {
          if (e) throw e;
          assert.equal(res, 2);
          done();
        });
      });

      it('should persist', function (done) {
        context.evaljs('x = 1', function (e) {
          if (e) throw e;
          context.evaljs('x', function (e, res) {
            assert.equal(res, 1);
            done();
          });
        });
      });

      // Failed in 0.1.5
      it('should pass errors of the right type', function (done) {
        context.evaljs('{', function (e) {
          assert.ok(e instanceof SyntaxError);
          done();
        });
      });

      it('should be able to handle native objects as return values', function (done) {
        context.evaljs('Array', function (e, res) {
          assert.ok(typeof res === 'string');
          done();
        });
      });

      // Fails in 0.1.4
      it('should be able to handle unknown error types', function (done) {
        context.evaljs('throw "wat"', function (e) {
          assert.equal(e, 'wat');
          done();
        });
      });

      // Fails in 0.1.4
      it('should be able to handle sublcassed errors', function (done) {
        context.evaljs('function E() {} E.prototype=new Error(); E.prototype.constructor = E; throw new E();', function (e) {
          assert.equal(e.__errorType__, 'E');
          done();
        });
      });
    });

    describe('#on', function () {
      it('should listen on custom events', function (done) {
        context.on('test', function (d) {
          assert.equal(d, 1);
        });
        context.on('test', function (d) {
          done();
        });
        context.evaljs('window.parent.stuffEmit("test", 1)', function () {});
      });
    });

    describe('#off', function () {
      it('should remove listeners from custom events', function (done) {
        function foo (d) {
          throw new Error('fail');
        }
        context.on('foo', foo);
        context.on('foo', done);
        context.off('foo', foo);
        context.evaljs('window.parent.stuffEmit("foo")');
      });
    });

    describe('callback API', function () {
      it('should run callbacks with the current Context as context', function (done) {
        var c = 0;
        var callback = function  () {
          assert.strictEqual(this, context);
          if (++c === 3) done();
        };
        context.evaljs('1', callback);
        context.load('foo', callback);
        context.html(callback);
        context.on('sup', callback);
        context.evaljs('window.parent.stuffEmit("sup")');
      });

      it('should run callbacks with the supplied context', function (done) {
        var c = 0
          , thisArg = {};
        var callback = function  () {
          assert.strictEqual(this, thisArg);
          if (++c === 3) done();
        };
        context.evaljs('1', callback, thisArg);
        context.load('foo', callback, thisArg);
        context.html(callback, thisArg);
        context.on('sup', callback, thisArg);
        context.evaljs('window.parent.stuffEmit("sup")');
      });

      it('should run callbacks with the current Context as context', function (done) {
        var c = 0;
        var callback = function  () {
          assert.strictEqual(this, context);
          if (++c === 3) done();
        };
        context.evaljs('1', callback);
        context.load('foo', callback);
        context.html(callback);
        context.on('sup', callback);
        context.evaljs('window.parent.stuffEmit("sup")');
      });

      // Failing in 0.2.0
      it('should not require events to have callbacks', function (done) {
        context.evaljs('window.parent.stuffEmit("noop")');
        done();
      });

      it('callbacks are optional', function (done) {
        context.on('foor');
        context.html();
        context.load('wat');
        done();
      });
    });

    describe('stuffOn', function () {
      it('should listen and emit custom events', function (done) {
        context.evaljs(
          'window.parent.stuffOn("foo",' +
          'function(data) { window.parent.stuffEmit("bar", data) })'
        );
        context.emit('foo', { x: 1, y: 2 });
        context.on('bar', function(data) {
          assert.deepEqual(data, { x: 1, y: 2 });
          done();
        });
      });
    });

    describe('misc', function () {
      it('should not be concerned with messages from other than the iframe', function (done) {
        context.eventQ['test'] = [function () {
          done(new Error('Fake message went through!'));
        }];
        window.postMessage({
          type: 'test'
        }, '*');
        setTimeout(done, 1000);
      });

      it('should delete all global names with each reload', function (done) {
        context.evaljs('window.foo = 1', function () {
          context.load('<html></html>', function () {
            context.evaljs('window.foo', function (e, res) {
              assert.equal(res, undefined);
              done();
            });
          });
        });
      });

      // Failing in 0.1.1
      it('should respect callback order', function () {
        context.evaljs('1');
        context.evaljs('2');
        context.evaljs('3', function (e, res) {
          assert.equal(res, 3);
        });
      });

      it('should adapt inner iframe height to outer iframe height', function (done) {
        context.iframe.style.height = '1000px';
        // :poop:
        setTimeout(function () {
          context.evaljs(
            'window.parent.document.querySelector("iframe").clientHeight'
          , function (e, h) {
              if (e) throw e;
              assert.equal(h, 1000);
              done();
            }
          );
        }, 250);
      });

      // Failing in 0.1.7
      it('should be able to make the iframe smaller to match the outer iframe', function (done) {
        context.iframe.style.height = '1000px';
        setTimeout(function () {
          context.iframe.style.height = '500px';
          setTimeout(function () {
            context.evaljs(
              'window.parent.document.querySelector("iframe").clientHeight'
            , function (e, h) {
                if (e) throw e;
                assert.equal(h, 500);
                done();
              }
            );
          }, 250);
        }, 250);
      });
    });
  });

})();
