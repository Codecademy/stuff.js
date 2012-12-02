;(function (win, undefined) {
  'use strict';

  var doc     = win.document
    , body    = doc.querySelector('body')
    // IE9 bug.
    , JSON    = win.JSON
    , iframe
    , secret;


  function reset () {
    if (iframe) body.removeChild(iframe);
    iframe = doc.createElement('iframe');
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', doc.height);
    body.appendChild(iframe);
  }

  function load (html) {
    reset();
    iframe.addEventListener('load', function () {
      post('load', null);
    }, false);
    var d = iframe.contentWindow.document;
    d.open();
    d.write(html);
    d.close();
  }

  function post (type, data) {
    var msg = JSON.stringify({
      data   : data
    , type   : type
    , secret : secret
    });
    win.top.postMessage(msg, '*');
  }

  function report (err, res) {
    if (err) {
      err = {
        message     : err.message
      , stack       : err.stack
      , type        : err.type
      , 'arguments' : err['arguments']
      , errorType   : String(err.constructor).trim().match(/^function ([A-Z][a-zA-Z]+)/)[1]
      };
    }
    if (typeof res === 'function') res = String(res);
    post('evaljs', {
      error  : err
    , result : res
    });
  }

  function evaljs (js) {
    var win = iframe.contentWindow
      , res = null;

    try {
      res = win['eval'](js);
    } catch (e) {
      report(e, null);
      throw e;
    }
    report(null, res);
  }

  function html () {
    post('html', iframe.contentWindow.document.documentElement.outerHTML);
  }

  var actions = {
    load   : load
  , evaljs : evaljs
  , html   : html
  };

  win.addEventListener('message', function (e) {
    var msg;
    try {
      msg  = JSON.parse(e.data);
    } catch (err) {
      return;
    }
    var type = msg.type
      , data = msg.data;

    if (!msg.secret) return;
    if (!secret && msg.type === 'handshake') {
      secret = msg.secret;
    } else if (msg.secret !== secret) {
      return;
    } else {
      actions[type](data);  
    }
  }, false);

})(window);
