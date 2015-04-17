var stat = require('node-static');
var path = require('path');

var dev    = new(stat.Server)(path.join(__dirname, '../'), {cache: 0})
  , secure = new(stat.Server)(path.join(__dirname, '../secure'), {cache: 0});

require('http').createServer(function (request, response) {
  dev.serve(request, response);
}).listen(8080);

require('http').createServer(function (request, response) {
  secure.serve(request, response);
}).listen(8888);