(function (win, undefined) {
  'use strict';

  var doc     = win.document
    , body    = doc.querySelector('body')
    , iframe
    , secret;


  function reset () {
    if (iframe) body.removeChild(iframe);
    iframe = doc.createElement('iframe');
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '100%');
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
    var msg = {
      data   : data
    , type   : type
    , secret : secret
    };
    win.top.postMessage(msg, '*');
  }

  function report (err, res) {
    if (err) {
      err = {
        message     : err.message
      , stack       : err.stack
      , type        : err.type
      , 'arguments' : err['arguments']
      , errorType   : err.constructor.name
      };
    }
    try {
      post('evaljs', {
        error  : err
      , result : res
      });
    } catch (e) {
      post('evaljs', {
        error  : err
      , result : JSON.stringify(res) || String(res)
      });
    }
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
    var msg  = e.data
      , type = msg.type
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
