define(function (require, exports, module) {
  'use strict';

  var iframes = []
    , noop    = function () {};

  function stuff (url, cb) {
    var iframe  = document.createElement('iframe')
      , context = new Context(iframe);

    window.addEventListener(
      'message', context.messageHandler.bind(context), false
    );

    iframes.push(iframe);
    iframe.setAttribute('src', url);

    function init () {
      iframe.removeEventListener('load', init);
      cb(context);
    }    
    iframe.addEventListener('load', init, false);
    document.querySelector('body').appendChild(iframe);
  }

  function Context (iframe) {
    this.iframe    = iframe;
    this.callbacks = {};
  }

  Context.prototype.messageHandler = function (e) {
    var msg  = e.data
      , data = msg.data
      , type = msg.type;
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  };

  Context.prototype.post = function (type, data) {
    this.iframe.contentWindow.postMessage({
      type: type
    , data: data
    }, '*');
  };

  Context.prototype.evaljs = function (js, cb) {      
    this.callbacks['evaljs'] = function (d) {
      (cb || noop)(d.error, d.result);
    };
    this.post('evaljs', js);
  };

  Context.prototype.load = function (html, cb) {
    var iframe = this.iframe;
    function callback () {
      iframe.removeEventListener('load', callback);
      (cb || noop)();
    }
    iframe.addEventListener('load', callback, false);
    this.post('load', html);
  };

  Context.prototype.html = function (cb) {
    this.callbacks['html'] = cb || noop;
    this.post('html', null);
  };

  stuff.clear = function () {
    iframes.forEach(function (iframe) {
      document.querySelector('body').removeChild(iframe);
    });
    iframes = [];
  };

  module.exports = stuff;
});
