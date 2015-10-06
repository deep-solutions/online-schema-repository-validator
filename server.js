var http = require("http"),
url = require("url"),
path = require("path"),
fs = require("fs"),
querystring = require("querystring"),
port = process.argv[2] || 8888;

function processPost(request, response, callback) {
	var queryData = "";
	if (typeof callback !== 'function')
		return null;

	if (request.method == 'POST') {
		request.on('data', function (data) {
			queryData += data;
			if (queryData.length > 1e6) {
				queryData = "";
				response.writeHead(413, {
					'Content-Type' : 'text/plain'
				}).end();
				request.connection.destroy();
			}
		});

		request.on('end', function () {
			request.post = querystring.parse(queryData);
			callback();
		});

	} else {
		response.writeHead(405, {
			'Content-Type' : 'text/plain'
		});
		response.end();
	}
}

http.createServer(function (request, response) {

	var uri = url.parse(request.url).pathname,
	filename = path.join(process.cwd() + "/site-prototype", uri);

	if (request.method == "POST") {
		console.log("Got a POST request");
		response.writeHead(200, "OK", {
			'Content-Type' : 'text/plain'
		});
		response.end();
	} else {
		fs.exists(filename, function (exists) {
			if (!exists) {
				response.writeHead(404, {
					"Content-Type" : "text/plain"
				});
				response.write("404 Not Found\n");
				response.end();
				return;
			}

			if (fs.statSync(filename).isDirectory())
				filename += '/index.html';

			fs.readFile(filename, "binary", function (err, file) {
				if (err) {
					response.writeHead(500, {
						"Content-Type" : "text/plain"
					});
					response.write(err + "\n");
					response.end();
					return;
				}

				response.writeHead(200);
				response.write(file, "binary");
				response.end();
			});
		});
	}
}).listen(parseInt(port, 10));

console.log("File server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
