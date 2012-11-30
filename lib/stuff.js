define(function (require, exports, module) {
  'use strict';

  var iframes = []
    , noop    = function () {};

  function stuff (url, cb) {
    var iframe = document.createElement('iframe')
      , iwin   = iframe.contentWindow;

    iframes.push(iframe);
    iframe.setAttribute('src', url);

    var noop   = function () {}
      , evalCb = noop;

    var post = function (type, data) {
      iwin.postMessage({
        type: type
      , data: data
      }, '*');
    };

    var evaljs = function (js, cb) {
      evalCb = cb || noop;
      post('evaljs', js);
    };

    var load = function (html) {
      post('load', html);
    };

    var ret = {
      evaljs : evaljs
    , load   : load
    };

    var init = function () {
      iwin = iframe.contentWindow;
      window.addEventListener('message', function (e) {
        var data = e.data;
        evalCb(data.error, data.result);
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
