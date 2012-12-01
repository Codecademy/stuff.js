(function (win, undefined) {
  'use strict';

  var doc     = win.document
    , _eval   = win['eval']
    , globals = Object.getOwnPropertyNames(win)
    , secret;

  function cleanUp () {
    // Need to access global reference of window for opera bug.
    Object.getOwnPropertyNames(window).forEach(function (key) {
      if (globals.indexOf(key) === -1) {
        try {
          window[key] = undefined;
        } catch (e) {
          // Cannot modify.
        }
      }
    });
  }

  function load (html) {
    cleanUp();

    doc.open();
    doc.write(html);
    doc.close();

    // looses bound events    
    bindMessaging();     
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
    var res = null;
    try {
      res = _eval(js);
    } catch (e) {
      report(e, null);
      throw e;
    }
    report(null, res);
  }

  function html () {
    post('html', doc.documentElement.outerHTML);
  }

  var actions = {
    load   : load
  , evaljs : evaljs
  , html   : html
  };

  function bindMessaging () {
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
  }

  bindMessaging();
})(window);
