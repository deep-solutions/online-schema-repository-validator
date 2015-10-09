$(document).ready(function () {
	var cdf_list = $('#cdf-list').get(0);
	// alert(cdf_list.outerHTML);
	$.get('/data/cdf_list.json', function (response) {
		var result = JSON.parse(response);
		// alert(result);
		$.each(result, function () {
			var li = $('<li/>')
				.appendTo(cdf_list);
			var a = $('<a/>')
				.attr('href', this.uri)
				.text(this.title + " (v" + this.version + ")")
				.appendTo(li);
		});
	});
});
