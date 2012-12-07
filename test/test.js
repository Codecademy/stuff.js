(function () {
  'use strict';

  var stuff  = window.stuff
    , assert = window.assert;

  var path = 'http://localhost:8888/index.html';

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
      stuff(path, div, function (context) {
        assert.equal(div.querySelectorAll('iframe').length, 1);
        done();
      });
    });

    it('should clear all iframes', function (done) {
      // create one more.
      stuff(path, function () {
        assert.equal(document.querySelectorAll('iframe').length, 3);
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
          assert.equal(e.type, 'E');
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
    });
  });


})();
