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
    rimraf = require("rimraf"),
	port = process.argv[2] || 8888,
    site_root = process.cwd() + "/site-prototype",
    json_file_name = site_root + "/data/cdf_list.json",
    wiki_template_file_name = "/templates/cdf/index.html";

function copyFile(path1, path2, callback) {
	// fs.createReadStream().pipe(fs.createWriteStream());
    var cb_called = false,
        source = site_root + path1,
        target = site_root + path2;

    var rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cb_called) {
            console.log(err);
            callback(err);
            cb_called = true;
        }
    }
}

function createFolder(new_dir, callback) {
    mkdirp.sync(site_root + new_dir, function(err) {
        if (err) {
		  console.log(err);
		  callback(err);
		} else {
		  console.log("Path created: " + new_dir);
		  callback(null);
		}
    });
}

function processPost(request, response, callback) {
	var query_data = "";
	if (typeof callback !== 'function')
		return null;

	if (request.method === 'POST') {
		request.on('data', function (data) {
			query_data += data;
			if (query_data.length > 1e6) {
				query_data = "";
				response.writeHead(413, {
					'Content-Type' : 'text/plain'
				});
				response.write("413: Request Entity Too Large");
				response.end();
				request.connection.destroy();
			}
		});

		request.on('end', function () {
			request.post = querystring.parse(query_data);
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

function addCDFEntry(name, version, schema_type, callback) {
	var cdf_list = require(json_file_name);
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
    var new_cdf_path = "/data/current/schemas/" + name + "/" + version;
    // Create the new path
    createFolder(new_cdf_path, function(err) {
		if (err) {
		  console.log("Error creating folder: " + err);
		  callback(err, null);
          return;
		} else {
		  console.log("Folder created at " + new_cdf_path);
		}
	});
    // Create wiki
    copyFile(wiki_template_file_name, new_cdf_path + "/index.html", function(err) {
		if (err) {
		  console.log("Error creating wiki: " + err);
		  callback(err, null);
          return;
		} else {
		  console.log("Wiki created at " + new_cdf_path);
		}
	});
	cdf_list[new_cdf_key] = new Object();
	cdf_list[new_cdf_key].id = max_id + 1;
	cdf_list[new_cdf_key].title = name;
	cdf_list[new_cdf_key].version = version;
	cdf_list[new_cdf_key].uri = new_cdf_path;
	cdf_list[new_cdf_key].schemaType = schema_type;
	cdf_list[new_cdf_key].schemaUri = "";
	cdf_list[new_cdf_key].archived = new Object();
	fs.writeFile(json_file_name, JSON.stringify(cdf_list, null, 4), function(err) {
		if (err) {
		  console.log(err);
		  callback(err, null);
          return;
		} else {
		  console.log("JSON saved to " + json_file_name);
		}
	});
    
    callback(null, "OK");
}

function changeCDFVersion(name, version, schema_type, callback) {
	var cdf_list = require(json_file_name);
	if (typeof callback !== 'function')
		return null;
	for (var cdf_key in cdf_list) {
		if (cdf_key.toLowerCase() === name.toLowerCase()) {
			// Archival process
			var cdf = cdf_list[cdf_key],
                archive_path = "/data/archive/schemas/" + name + "/" + cdf.version,
                archive_schema_path = archive_path + "/" + path.basename(cdf.schemaUri),
                new_cdf_path = "/data/current/schemas/" + name + "/" + version,
                new_schema_path = cdf.schemaUri;
			console.log("Changing " + name + " version from " + cdf.version + " to " + version);
			mkdirp(archive_path, function(err) {
				console.log("Error creating folder: " + archive_path + " - " + err);
				callback(err, null);
				return;
			});
            mkdirp(new_cdf_path, function(err) {
				console.log("Error creating folder: " + new_cdf_path + " - " + err);
				callback(err, null);
				return;
			});
            copyFile(cdf.schemaUri, archive_schema_path, function(err) {
                if (err) {
                  console.log("Error archiving wiki to: " + archive_schema_path + " - " + err);
                  callback(err, null);
                  return;
                } else {
                  console.log("Wiki created at " + new_cdf_path);
                }
            });
            copyFile(wiki_template_file_name, new_cdf_path + "/index.html", function(err) {
                if (err) {
                  console.log("Error creating new wiki at: " + new_cdf_path + " - " + err);
                  callback(err, null);
                  return;
                } else {
                  console.log("Wiki created at " + new_cdf_path);
                }
            });
            rimraf(cdf.uri, function(err) {
                if (err) {
                    console.log("Error removing current version folder: " + err);
                    callback(err, null);
                    return;
                } else {
                    console.log("Removed current version folder");
                }
			});
			cdf.archived[cdf.version] = new Object();
			cdf.archived[cdf.version].title = cdf.title;
			cdf.archived[cdf.version].version = cdf.version;
			cdf.archived[cdf.version].uri = archive_path;
			cdf.archived[cdf.version].schemaType = cdf.schemaType;
			cdf.archived[cdf.version].schemaUri = archive_schema_path;
            cdf.version = version;
            cdf.uri = new_cdf_path;
            cdf.schemaType = schema_type;
            cdf.schemaUri = new_schema_path;
			break;
		}
	}
}

http.createServer(function (request, response) {

	var uri = url.parse(request.url).pathname,
        filename = path.join(site_root, uri);

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
			} else if (url === '/forms/update-cdf-version.html') {
				changeCDFVersion(post.cdf_name, post.cdf_version, post.cdf_schema_type, function (err, result) {
					if (err) {
						response.writeHead(500, {
						"Content-Type" : "text/plain"
						});
						response.write("500: Internal Error while changing CDF version - " + err + "\n");
						response.end();
						return;
					} else {
						console.log("Reversioning CDF succeeded - " + result);
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
