var stat = require('node-static');
var dev    = new(stat.Server)('./', {cache: 0});
var secure = new(stat.Server)('./secure', {cache: 0});

require('http').createServer(function (request, response) {
  dev.serve(request, response);
}).listen(8080);

require('http').createServer(function (request, response) {
  secure.serve(request, response);
}).listen(8888);