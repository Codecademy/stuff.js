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
  // ready for interaction.
  function stuff (url, cb) {
    var iframe  = document.createElement('iframe')
      , context = new Context(iframe);

    // We will be communicating with iframe using the window messaging API. 
    global.addEventListener(
      'message', context.messageHandler.bind(context), false
    );

    iframes.push(iframe);
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('src', url);

    // Listen to the first load event on the iframe to call the callback
    // with the `context`.
    function init () {
      iframe.removeEventListener('load', init);
      context.handshake();
      cb(context);
    }    
    iframe.addEventListener('load', init, false);

    // Finally append the iframe to the body to get going.
    // TODO: Think about styling.
    document.querySelector('body').appendChild(iframe);
  }

  // Remove all our iframes from the page.
  stuff.clear = function () {
    iframes.forEach(function (iframe) {
      document.querySelector('body').removeChild(iframe);
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

    // A large enough random number that is used as a secret for between
    // top and child iframe.
    this.secret = Math.ceil(Math.random() * 999999999) + 1;
  }

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
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
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
    this.callbacks.evaljs = function (d) {
      var e = d.error
        , error;
      if (e) {

        // Reconstruct the error into a native one using the info we have.
        var Type = global[e.errorType];
        error = new Type(e.message);
        error.stack = e.stack;
        error.type = e.type;
        error['arguments'] = e['arguments'];
      }
      (cb || noop)(error, d.result);
    };
    this.post('evaljs', js);
  };

  // Load HTML.
  Context.prototype.load = function (html, cb) {
    this.callbacks.load = cb || noop;
    this.post('load', html);
  };

  // Get current iframe HTML.
  Context.prototype.html = function (cb) {
    this.callbacks.html = cb || noop;
    this.post('html', null);
  };

  // Sends the secret to the iframe.
  Context.prototype.handshake = function () {
    this.post('handshake', this.secret);
  };

  // Export `stuff` and expose the `Context` class on it.
  stuff.Context  = Context;
  global.stuff   = stuff;

})(this);
