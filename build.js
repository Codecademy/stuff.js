var ugl = require("uglify-js")
  , fs  = require('fs');


fs.writeFileSync('dist/stuff.min.js', ugl.minify('lib/stuff.js').code);
fs.writeFileSync('dist/secure/runner.js', ugl.minify('secure/runner.js').code);
fs.writeFileSync('dist/secure/index.html', fs.readFileSync('secure/index.html'));