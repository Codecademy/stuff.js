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
  function stuff (url, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    if (!cb) cb = noop;
    var el = (options && options.nodeType === 1) 
           ? options : options.el || document.querySelector('body');
    options.el = null;

    var iframe  = document.createElement('iframe')
      , context = new Context(iframe, options);

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
  function Context (iframe, options) {
    this.iframe    = iframe;
    this.callbacks = {};
    this.eventQ    = { load   : []
                     , evaljs : []
                     , html   : [] };

    if (options.sandbox === true) {
      this.sandbox = 'allow-scripts allow-same-origin';
    } else if (typeof options.sandbox === 'string') {
      var sandbox = options.sandbox;
      if (sandbox.indexOf('allow-scripts') === -1) sandbox += ' allow-scripts';
      if (sandbox.indexOf('allow-same-origin') === -1) sandbox += ' allow-same-origin';
      this.sandbox = sandbox;
    } else {
      this.sandbox = null;
    }

    // A large enough random number that is used as a secret for between
    // top and child iframe.
    this.secret = Math.ceil(Math.random() * 999999999) + 1;
  }

  Context.prototype.handle = function (type, data) {
    var that = this
      , callbacks;
    if (type === 'custom') {
      var msg = data;
      callbacks = this.callbacks[msg.type] || [];
      callbacks.forEach(function (cb) {
        if (typeof cb === 'function') cb.call(cb.thisArg || that, msg.data);
      });
    } else {
      callbacks = this.eventQ[type];
      if (!callbacks) return;
      var cb = callbacks.shift();
      if (typeof cb === 'function') cb.call(cb.thisArg || that, data);  
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
  Context.prototype.evaljs = function (js, cb, thisArg) {
    var callback = function (d) {
      var e     = d.error
        , error = e 
        , Type;

      // Try to reconstruct the error into a native one using the info we have.
      if (e && (Type = global[e.__errorType__])) {
        error       = new Type(e.message);
        error.stack = e.stack;
        error.type  = e.type;

        // `arguments` as a reserved keyword in jshint.
        error['arguments'] = e['arguments'];  
      }
      (cb || noop).call(this, error, d.result);
    };
    callback.thisArg = thisArg;
    this.eventQ.evaljs.push(callback);
    this.post('evaljs', js);
  };

  // Load HTML.
  Context.prototype.load = function (html, cb, thisArg) {
    cb = cb || noop;
    cb.thisArg = thisArg;
    this.eventQ.load.push(cb);
    this.post('load', html);
  };

  // Get current iframe HTML.
  Context.prototype.html = function (cb, thisArg) {
    cb = cb || noop;
    cb.thisArg = thisArg;
    this.eventQ.html.push(cb);
    this.post('html', null);
  };

  // Sends the secret to the iframe.
  Context.prototype.handshake = function () {
    this.post('handshake', this.sandbox);
  };

  // Listen on custom events.
  Context.prototype.on = function (event, cb, thisArg) {
    cb = cb || noop;
    cb.thisArg = thisArg;
    if (this.callbacks[event]) {
      this.callbacks[event].push(cb);
    } else {
      this.callbacks[event] = [cb];
    }
  };

  // Remove `callback` from the custom event listeners.
  Context.prototype.off = function (event, cb) {
    var callbacks = this.callbacks[event];
    if (callbacks) {
      var i = callbacks.indexOf(cb);
      if (i !== -1) callbacks.splice(i, 1);
    } else {
      this.callbacks[event] = [];
    }
  };

  Context.prototype.emit = function (event, data) {
    this.post('_custom_' + event, data);
  }

  // Export `stuff` and expose the `Context` class on it.
  stuff.Context  = Context;
  global.stuff   = stuff;

})(this);
