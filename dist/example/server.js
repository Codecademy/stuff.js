var stat = require('node-static');
var path = require('path');

//
// Create a node-static server instance to serve the './public' folder
//
var dev    = new(stat.Server)(path.join(__dirname, '../'), {cache: 0})
  , secure = new(stat.Server)(path.join(__dirname, '../secure'), {cache: 0});

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        dev.serve(request, response);
    });
}).listen(8080);

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        secure.serve(request, response);
    });
}).listen(8888);