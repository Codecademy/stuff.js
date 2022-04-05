## Stuff.js

A secure and easy way to run arbitrary HTML / JS / CSS code in an iframe.

Stuff.js is a client-side JS library that is meant to be loaded from different [origins](https://developer.mozilla.org/en-US/docs/JavaScript/Same_origin_policy_for_JavaScript) to restrict access from the iframe to it's parent(s). [Read more](http://blog.amasad.me/2012/12/11/stuffjs/).

Node is only required for testing and developlment and is only used as a static server. Feel free to use your web server of choice.

## Run the example

```
node dist/example/server.js
```

Navigate browser to http://localhost:8080/example

## Running Tests

```
node server.js
```

Navigate browser to http://localhost:8080/test/tests.html

## Building

An up-to-date pre-built version can be found in the `dist` folder.
To build:

```
node build.js
```

## Usage

Place the secure folder on a different origin you intend to use stuff.js.
Origin could mean different protocol, port, and or domain name.

```javascript
stuff(secureUrl, function (context) {
  context.load("<body>stuff</body>");
});
```

## API

### stuff(url, [options], cb(context))

The main constructor function that loads the secure iframe from `url` and
calls `cb` with the context (see below). Optionally, you can pass in an
options object as the second argument and can contain any of the following:

- `el` an element to append the iframe to. Defaults to the body.
- `sandbox` You can pass in a space delimited string of the [HTML5 sandbox flags](http://www.html5rocks.com/en/tutorials/security/sandboxed-iframes/) or simply `true` to add the attribute with the minimum flags needed to function:
  - `allow-scripts` needed for the iframe to function.
  - `allow-same-origin` needed for basic interactions with the iframe.

### stuff.clear()

Clears all stuff iframe instances from the page.

### Context

The execution context for the code. It is the class that wraps the secure iframe.

### Context#load(htmlCode, cb())

Writes `htmlCode` to the iframe document and calls `cb` when the load event fires.

### Context#evaljs(jsCode, cb(error, result))

Executes arbitrary javascript `jsCode` in the context. Calls `cb` with the error (null if no error)
and the result.

### Context#html(cb(htmlCode))

Gets the current iframe document html.

### Context#iframe

Is just the iframe element available for DOM manipulation. Note that if you move the iframe, it has to reload and will _lose all code and state_.

### Custom events

Sometimes you may find yourself wanting to communicate back to the outside world from inside the execution
context.

#### window.parent.stuffEmit(event, data)

Emit an event to the conetxt. See `Context#on` to listen on this.

#### window.parent.stuffOn(event, data)

Listen to event sent by `context.emit`.

#### Context#emit(event, data)

Emit events that can be listened on via `window.parent.stuffOn`.

#### Context#on(event, cb(data))

Listen on custom events.

#### Context#off(event, [cb])

Remove callback `cb` if specified. Otherwise nuke all listeners.

## Browser support

Tested on:

- Latest Chrome and Firefox.
- Opera 12+
- IE9 and IE10
- Safari 6

## License

MIT License.
Copyright (c) 2022 Codecademy LLC
