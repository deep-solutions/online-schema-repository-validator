/*********************************
	Node.js Server Script
	Author: Deep Bhattacharya
	Version: 0.1
	Date: 08-10-2015
*********************************/


var http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs"),
	querystring = require("querystring"),
	mkdirp = require("mkdirp"),
	port = process.argv[2] || 8888;

function isEmptyObject(obj) {
	return !Object.keys(obj).length;
}

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

function addCDFEntry(name, version, schematype, callback) {
	var jsonfilename = process.cwd() + "/site-prototype/data/cdf_list.json";
	var cdf_list = require(jsonfilename);
	var max_id = 0;
	if (typeof callback !== 'function')
		return null;
	// console.log("Loop through CDF list");
	var new_cdf_key = name.toLowerCase();
	if (cdf_list[cdf_key] != null) {
		err = "CDF with name " + new_cdf_key + " already exists!";
		console.log(err);
		callback(err, null);
		return;
	}
	for (var cdf_key in cdf_list) {
		// console.log("Iterate: " + cdf_key + " with id: " + cdf_list[cdf_key].id);
		if (cdf_list[cdf_key].id > max_id) {
			max_id = cdf_list[cdf_key].id;
		}
	}
	// Add new entry to file
	cdf_list[new_cdf_key] = new Object();
	cdf_list[new_cdf_key].id = max_id + 1;
	cdf_list[new_cdf_key].title = name;
	cdf_list[new_cdf_key].version = version;
	cdf_list[new_cdf_key].uri = "/data/current/schemas/" + name + "/" + version;
	cdf_list[new_cdf_key].schemaType = schematype;
	cdf_list[new_cdf_key].schemaUri = "";
	cdf_list[new_cdf_key].archived = new Object();
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

function addNewCDFVersion(name, version, schematype, callback) {
	var jsonfilename = process.cwd() + "/site-prototype/data/cdf_list.json";
	var cdf_list = require(jsonfilename);
	if (typeof callback !== 'function')
		return null;
	for (var cdf_key in cdf_list) {
		if (cdf_key.toLowerCase() === name.toLowerCase()) {
			// Archival process
			var cdf = cdf_list[cdf_key];
			console.log("Changing " + name + " version from " + cdf.version + " to " + version);
			var archive_path = "/data/current/schemas/" + name + "/" + cdf.version;
			mkdirp(archive_path, function(err) {
				console.log(err);
				callback(err, null);
				return;
			});
			cdf.archived[cdf.version] = new Object();
			cdf.archived[cdf.version].title = cdf.title;
			cdf.archived[cdf.version].version = cdf.version;
			cdf.archived[cdf.version].uri = archive_path;
			cdf.archived[cdf.version].schemaType = schematype;
			cdf.archived[cdf.version].schemaUri = archive_path + "/default.xsd";
			break;
		}
	}
}

http.createServer(function (request, response) {

	var uri = url.parse(request.url).pathname,
	filename = path.join(process.cwd() + "/site-prototype", uri);

	if (request.method === "POST") {
		console.log("Got a POST request");
		processPost(request, response, function(post, url) {
			console.log("Processing POST request");
			// console.log(post);
			if (url === '/forms/add-new-cdf.html') {
				addCDFEntry(post.cdf_name, post.cdf_version, post.cdf_schema_type, function (err, result) {
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
