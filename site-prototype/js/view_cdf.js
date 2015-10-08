$(document).ready(function () {
	var current_path = window.location.pathname;
	var jsonfilename = "/data/cdf_list.json";
	// alert(current_path);
	$.get(jsonfilename, function (response) {
		var result = JSON.parse(response);
		var cdf_name = $('#cdf-name');
		var cdf_version = $('#cdf-version');
		var cdf_address = $('#cdf-address');
		var iterate = true;
		$.each(result, function () {
			if (this.uri == current_path) {
				$(document).prop('title', 'Common Data Format - ' + this.title)
				cdf_name.html(this.title);
				cdf_version.html(this.version);
				cdf_address.html("<a href=" + this.schemaUri + ">here</a>");
				iterate = false;
			} else if (!($.isEmptyObject(this.archived))) {
				$.each(this.archived, function() {
					if (this.uri === current_path) {
						$(document).prop('title', 'Common Data Format Archive - ' + this.title)
						cdf_name.html(this.title);
						cdf_version.html(this.version);
						cdf_address.html("<a href=" + this.schemaUri + ">here</a>");
						iterate = false;
					}
				});
			};
		});
	});
});
