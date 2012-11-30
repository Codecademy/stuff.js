define(function (require, exports, module) {
  'use strict';

  var iframes = []
    , noop    = function () {};

  function stuff (url, cb) {
    var iframe    = document.createElement('iframe')
      , iwin      = iframe.contentWindow
      , callbacks = {};

    iframes.push(iframe);
    iframe.setAttribute('src', url);

    var post = function (type, data) {
      iwin.postMessage({
        type: type
      , data: data
      }, '*');
    };

    var evaljs = function (js, cb) {      
      callbacks['evaljs'] = cb || noop;
      post('evaljs', js);
    };

    var load = function (html, cb) {
      function callback () {
        iframe.removeEventListener('load', callback);
        (cb || noop)();
      }
      iframe.addEventListener('load', callback, false);
      post('load', html);
    };

    var html = function (cb) {
      callbacks['html'] = cb || noop;
      post('html', null);
    };

    var ret = {
      evaljs : evaljs
    , load   : load
    , html   : html
    };

    var init = function () {
      iwin = iframe.contentWindow;
      window.addEventListener('message', function (e) {
        var msg  = e.data
          , data = msg.data
          , type = msg.type;
        if (callbacks[type]) {
          callbacks[type](data);
        }
      }, false);
      iframe.removeEventListener('load', init);
      cb(ret);
    };

    iframe.addEventListener('load', init, false);
    document.querySelector('body').appendChild(iframe);
  }

  stuff.clear = function () {
    iframes.forEach(function (iframe) {
      document.querySelector('body').removeChild(iframe);
    });
    iframes = [];
  };

  module.exports = stuff;

});
