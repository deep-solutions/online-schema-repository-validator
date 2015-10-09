/*********************************
Node.js Server Script
Author: Deep Bhattacharya
Version: 0.10
Date: 08-10-2015
**********************************/

var http = require("http"),
url = require("url"),
path = require("path"),
fs = require("fs"),
fse = require("fs-extra"),
formidable = require("formidable"),
port = process.argv[2] || 8888,
site_root = process.cwd() + "/site-prototype",
json_file_name = site_root + "/data/cdf_list.json",
wiki_template_file_name = "/templates/cdf/index.html";

function processPost(request, response, callback) {
	if (typeof callback !== 'function')
		return null;

	if (request.method === 'POST') {
		// Instantiate a new formidable form for processing
		var form = new formidable.IncomingForm();

		// form.parse analyzes the incoming stream data, picking apart the different fields and files
		form.parse(request, function (err, fields, files) {
			// console.log(fields);
			// console.log(files);
			if (err) {
				console.error(err.message);
				response.writeHead(500, {
					"Content-Type" : "text/plain"
				});
				response.write("500: Internal Error - " + err.message + "\n");
				response.end();
				return;
			}
			post = fields;
			post.cdf_file_path = files.cdf_file.path;
			post.cdf_file_name = files.cdf_file.name;
			callback(post, request.url);
		});
	} else {
		response.writeHead(405, {
			'Content-Type' : 'text/plain'
		});
		response.write("405: Method Not Supported - Function processPost() Only Handles POST Requests");
		response.end();
	}
}

function addCDFEntry(name, version, schema_type, cdf_file_path, cdf_file_name, callback) {
	var cdf_list = require(json_file_name),
	max_id = 0;
	if (typeof callback !== 'function')
		return null;
	// console.log("Loop through CDF list");
	var new_cdf_key = name.toLowerCase(),
	new_cdf_path = "/data/current/schemas/" + name + "/" + version,
	new_schema_path = "/data/current/schemas/" + name + "/" + cdf_file_name;
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
	// Create the new path
	fse.mkdirs(site_root + new_cdf_path, function (err) {
		if (err) {
			console.log("Error creating folder: " + err);
			callback(err, null);
			return;
		} else {
			console.log("Folder created at " + new_cdf_path);
			// Create wiki
			fse.copy(site_root + wiki_template_file_name, site_root + new_cdf_path + "/index.html", function (err) {
				if (err) {
					console.log("Error creating wiki: " + err);
					callback(err, null);
					return;
				} else {
					console.log("Wiki created at " + new_cdf_path);
					// Create schema file
					fse.copy(cdf_file_path, site_root + new_schema_path, function (err) {
						if (err) {
							console.log("Error saving file: " + err);
							callback(err, null);
							return;
						} else {
							console.log("File saved at " + new_schema_path);
							// Add entry in JSON
							cdf_list[new_cdf_key] = new Object();
							cdf_list[new_cdf_key].id = max_id + 1;
							cdf_list[new_cdf_key].title = name;
							cdf_list[new_cdf_key].version = version;
							cdf_list[new_cdf_key].uri = new_cdf_path;
							cdf_list[new_cdf_key].schemaType = schema_type;
							cdf_list[new_cdf_key].schemaUri = new_schema_path;
							cdf_list[new_cdf_key].archived = new Object();
							fs.writeFile(json_file_name, JSON.stringify(cdf_list, null, 4), function (err) {
								if (err) {
									console.log(err);
									callback(err, null);
									return;
								} else {
									console.log("JSON saved to " + json_file_name);
									callback(null, "OK");
									return;
								}
							});
						}
					});
				}
			});
		}
	});
}

function changeCDFVersion(name, version, schema_type, cdf_file_path, cdf_file_name, callback) {
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
			new_schema_path = cdf.schemaUri; // Unchanged
			console.log("Changing " + name + " version from " + cdf.version + " to " + version);
			fse.mkdirs(site_root + archive_path, function (err) {
				if (err) {
					console.log("Error creating archive folder: " + archive_path + " - " + err);
					callback(err, null);
					return;
				} else {
					console.log("Archive folder created at " + archive_path);
					fse.mkdirs(site_root + new_cdf_path, function (err) {
						if (err) {
							console.log("Error creating new version: " + new_cdf_path + " - " + err);
							callback(err, null);
							return;
						} else {
							console.log("Folder for new version created at " + new_cdf_path);
							fse.move(site_root + cdf.schemaUri, site_root + archive_schema_path, function (err) {
								if (err) {
									console.log("Error archiving schema to: " + archive_schema_path + " - " + err);
									callback(err, null);
									return;
								} else {
									console.log("Schema file archived to " + new_cdf_path);
									fse.copy(site_root + cdf.uri + "/index.html", site_root + new_cdf_path + "/index.html", function (err) {
										if (err) {
											console.log("Error creating new wiki at: " + new_cdf_path + " - " + err);
											callback(err, null);
											return;
										} else {
											console.log("Wiki created at " + new_cdf_path);
											fse.copy(site_root + cdf.uri + "/index.html", site_root + archive_path + "/index.html", function (err) {
												if (err) {
													console.log("Error archiving wiki to: " + archive_path + " - " + err);
													callback(err, null);
													return;
												} else {
													console.log("Wiki archived to " + archive_path);
													fse.remove(site_root + cdf.uri, function (err) {
														if (err) {
															console.log("Error removing current version folder: " + err);
															callback(err, null);
															return;
														} else {
															console.log("Current version folder deleted: " + cdf.uri);
															fse.copy(cdf_file_path, site_root + new_schema_path, function (err) {
																if (err) {
																	console.log("Error saving schema file: " + err);
																	callback(err, null);
																	return;
																} else {
																	console.log("Schema file saved at " + new_schema_path);
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
																	fs.writeFile(json_file_name, JSON.stringify(cdf_list, null, 4), function (err) {
																		if (err) {
																			console.log(err);
																			callback(err, null);
																			return;
																		} else {
																			console.log("JSON saved to " + json_file_name);
																			callback(null, "OK");
																			return;
																		}
																	});
																}
															});
														}
													});
												}
											});
										}
									});
								}
							});
						}
					});
				};
			});
			break;
		}
	}
}

http.createServer(function (request, response) {

	var uri = url.parse(request.url).pathname,
	filename = path.join(site_root, uri);

	if (request.method === "POST") {
		console.log("Got a POST request");
		processPost(request, response, function (post, url) {
			console.log("Processing POST request body");
			// console.log(post);
			switch (url) {
				case '/forms/add-new-cdf.html':
					addCDFEntry(post.cdf_name, post.cdf_version, post.cdf_schema_type, post.cdf_file_path, post.cdf_file_name, function (err, result) {
						if (err) {
							console.log("Adding CDF failed - " + err);
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
								'Location' : '/'
							});
							response.end();
							return;
						}
					});
				break;
				
				case '/forms/change-cdf-version.html':
					changeCDFVersion(post.cdf_name, post.cdf_version, post.cdf_schema_type, post.cdf_file_path, post.cdf_file_name, function (err, result) {
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
								'Location' : '/'
							});
							response.end();
							return;
						}
					});
				break;
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
