// **stuff.js** provides a secure and convinient way to sandbox untrusted
// html/js/css code in an iframe.

;(function (global) {
  'use strict';

  // Setup
  // -----

  // Keep a reference to all created iframe elements.
  var iframes = []
    , noop    = function () {};


  // stuff
  // -----

  // Creates a new `Context` with a runner iframe on preferably a different
  // origin and calls the callback with the new `Context` object that is
  // ready for interaction. The iframe is appended to `el` if specified
  // otherwise it's added to the body element.
  function stuff (url, el, cb) {
    if (typeof el === 'function') {
      cb = el;
      el = null;
    }
    if (!cb) cb = noop;
    if (!el) el = document.querySelector('body');

    var iframe  = document.createElement('iframe')
      , context = new Context(iframe);

    // We will be communicating with iframe using the window messaging API. 
    global.addEventListener(
      'message', context.messageHandler.bind(context), false
    );

    iframes.push(iframe);
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('src', url);

    // Listen to the load events of the iframe. It fires the first time we add
    // it to the body, but also could fire if the iframe was moved around. We
    // call `cb` only once as the context objects doesn't change, we just rehandshake.
    var once = false;
    function init () {
      context.handshake();
      if (!once) {
        cb(context);
        once = true;
      }
    }
    iframe.addEventListener('load', init, false);

    // Finally append the iframe to the body to get going.
    el.appendChild(iframe);
  }

  // Remove all our iframes from the page.
  stuff.clear = function () {
    iframes.forEach(function (iframe) {
      var parent = iframe.parentElement;
      if (parent) parent.removeChild(iframe);
    });
    iframes = [];
  };

  // Context
  // -------

  // Creates a wrapper around the iframe that takes care of communication
  // with the secure `iframe` and gives us a nice API to interact with.
  function Context (iframe) {
    this.iframe    = iframe;
    this.callbacks = {};
    this.eventQ    = { load   : []
                     , evaljs : []
                     , html   : [] };

    // A large enough random number that is used as a secret for between
    // top and child iframe.
    this.secret = Math.ceil(Math.random() * 999999999) + 1;
  }

  Context.prototype.handle = function (type, data) {
    var callbacks;
    if (type === 'custom') {
      var msg = data;
      callbacks = this.callbacks[msg.type];
      callbacks.forEach(function (cb) {
        if (typeof cb === 'function') cb(msg.data);
      });
    } else {
      callbacks = this.eventQ[type];
      if (!callbacks) return;
      var cb = callbacks.shift();
      if (typeof cb === 'function') cb(data);  
    }
  };

  // Parse and react to messages.
  Context.prototype.messageHandler = function (e) {
    var msg;
    try {
      msg = JSON.parse(e.data);
    } catch (err) {

      // If the message is not valid JSON then it's definitely not ours.
      return;
    }

    // Message secret doesn't match. Maybe for a different Context or
    // just something else.
    if (msg.secret !== this.secret) return;

    var data = msg.data
      , type = msg.type;

    this.handle(type, data);
  };

  // Sends messages to the secure iframe.
  Context.prototype.post = function (type, data) {
    this.iframe.contentWindow.postMessage(JSON.stringify({
      type   : type
    , data   : data
    , secret : this.secret
    }), '*');
  };

  // Evals JS code in the secure iframe.
  Context.prototype.evaljs = function (js, cb) {
    this.eventQ.evaljs.push(function (d) {
      var e     = d.error
        , error = e 
        , Type;

      // Try to reconstruct the error into a native one using the info we have.
      if (e && (Type = global[e.__errorType__])) {
        error       = new Type(e.message);
        error.stack = e.stack;
        error.type  = e.type;

        // jshint issue.. arguments as a reserved keyword.
        error['arguments'] = e['arguments'];  
      }
      (cb || noop)(error, d.result);
    });

    this.post('evaljs', js);
  };

  // Load HTML.
  Context.prototype.load = function (html, cb) {
    this.eventQ.load.push(cb);
    this.post('load', html);
  };

  // Get current iframe HTML.
  Context.prototype.html = function (cb) {
    this.eventQ.html.push(cb);
    this.post('html', null);
  };

  // Sends the secret to the iframe.
  Context.prototype.handshake = function () {
    this.post('handshake', this.secret);
  };

  // Listen on custom events.
  Context.prototype.on = function (event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    } else {
      this.callbacks[event] = [callback];
    }
  };

  // Remove `callback` from the custom event listeners.
  Context.prototype.off = function (event, callback) {
    var callbacks = this.callbacks[event];
    if (callbacks) {
      var i = callbacks.indexOf(callback);
      if (i !== -1) callbacks.splice(i, 1);
    } else {
      this.callbacks[event] = [];
    }
  };

  // Export `stuff` and expose the `Context` class on it.
  stuff.Context  = Context;
  global.stuff   = stuff;

})(this);
