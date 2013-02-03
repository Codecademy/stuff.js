var stat = require('node-static');

//
// Create a node-static server instance to serve the './public' folder
//
var dev    = new(stat.Server)('./', {cache: 0})
  , secure = new(stat.Server)('./secure', {cache: 0});

require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    dev.serve(request, response);
  });
}).listen(8080);

require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    secure.serve(request, response);
  });
}).listen(8888);