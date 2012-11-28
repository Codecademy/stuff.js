(function (window, undefined) {
  'use strict';

  var doc     = window.document
    , _eval   = window['eval']
    , globals = Object.getOwnPropertyNames(window);

  function cleanUp () {
    Object.getOwnPropertyNames(window).forEach(function (key) {
      if (globals.indexOf(key) === -1) {
        window[key] = undefined;
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

  function post (obj) {
    window.top.postMessage(obj, '*');
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
      post({
        error  : err
      , result : res
      });
    } catch (e) {
      post({
        error  : err
      , result : JSON.stringify(res)
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

  var actions = {
    load   : load
  , evaljs : evaljs
  };

  function bindMessaging () {
    window.onmessage = function (e) {
      var d    = e.data
        , type = d.type
        , data = d.data ;
      actions[type](data);
    };  
  }

  bindMessaging();
})(window);
