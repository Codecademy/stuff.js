Stuff.js
--------

A secure way to run arbitrary HTML / JS / CSS code in an iframe.


## Example

```
node dist/server.js
```

Navigate browser to http://localhost:8080/



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
  context.load('<body>stuff</body>');
});
```


## API

### stuff(url, cb(context))

The main constructor function that loads the secure iframe from `url` and
calls `cb` with the context (see below).

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

