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

	if (request.method === 'POST') {
		request.on('data', function (data) {
			queryData += data;
			if (queryData.length > 1e6) {
				queryData = "";
				response.writeHead(413, {
					'Content-Type' : 'text/plain'
				});
			response.write("413: Request Entity Too Large");
			response.end();
			request.connection.destroy();
			}
		});

		request.on('end', function () {
			request.post = querystring.parse(queryData);
			callback(request.post, request.url);
		});

	} else {
		response.writeHead(405, {
			'Content-Type' : 'text/plain'
		});
		response.write("405: Method Not Supported - Function processPost() Only Handles POST Requests");
		response.end();
	}
}

function createCDF(name, version, schematype, callback) {
	var jsonfilename = process.cwd() + "/site-prototype/data/cdf_list.json";
	var cdf_list = require(jsonfilename);
	var max_id = 0;
	// console.log("Loop through CDF list");
	for (var cdf_key in cdf_list) {
		// console.log("Iterate: " + cdf_key + " with id: " + cdf_list[cdf_key].id);
		if (cdf_list[cdf_key].id > max_id) {
			max_id = cdf_list[cdf_key].id;
		}
	}
	var new_cdf_key = (name + "_"  + version).toLowerCase();
	cdf_list[new_cdf_key] = new Object();
	cdf_list[new_cdf_key].id = max_id + 1;
	cdf_list[new_cdf_key].title = name;
	cdf_list[new_cdf_key].version = version;
	cdf_list[new_cdf_key].uri = "/data/current/schemas/" + name + "/" + version;
	cdf_list[new_cdf_key].schemaType = schematype;
	cdf_list[new_cdf_key].schemaUri = "";
	cdf_list[new_cdf_key].archived = "false";
	fs.writeFile(jsonfilename, JSON.stringify(cdf_list, null, 4), function(err) {
		if (err) {
		  console.log(err);
		  callback(err, null);
		} else {
		  console.log("JSON saved to " + jsonfilename);
		  callback(null, "OK");
		}
	});
}

http.createServer(function (request, response) {

	var uri = url.parse(request.url).pathname,
	filename = path.join(process.cwd() + "/site-prototype", uri);

	if (request.method === "POST") {
		console.log("Got a POST request");
		processPost(request, response, function(post, url) {
			console.log("Processing POST request");
			console.log(post);
			if (url === '/forms/add-new-cdf.html') {
				createCDF(post.cdf_name, post.cdf_version, post.cdf_schema_type, function (err, result) {
					if (err) {
						response.writeHead(500, {
						"Content-Type" : "text/plain"
						});
						response.write("500: Internal Error while adding CDF - " + err + "\n");
						response.end();
						return;
					} else {
						console.log("Adding CDF succeeded - " + result);
						console.log("Redirecting to Home Page...");
						response.writeHead(302, {
							'Location': '/'
						});
						response.end();
						return;
					}
				});
			}
		});		
	} else if (request.method === "GET") {
		fs.exists(filename, function (exists) {
			if (!exists) {
				response.writeHead(404, {
					"Content-Type" : "text/plain"
				});
				response.write("404: Resource Not Found\n");
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
					response.write("500: Internal Error - " + err + "\n");
					response.end();
					return;
				}

				response.writeHead(200);
				response.write(file, "binary");
				response.end();
			});
		});
	} else {
		response.writeHead(405, {
			"Content-Type" : "text/plain"
		});
		response.write("405: Method Not Supported");
		response.end();
	}
}).listen(parseInt(port, 10));

console.log("File server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
