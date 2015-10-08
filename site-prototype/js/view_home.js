$(document).ready(function () {
	var cdf_list = $('#cdf-list').get(0);
	// alert(cdf_list.outerHTML);
	$.get('/data/cdf_list.json', function (response) {
		var result = JSON.parse(response);
		// alert(result);
		$.each(result, function () {
			if (this.archived == 'true')
				return;
			var li = $('<li/>')
				.appendTo(cdf_list);
			var a = $('<a/>')
				.attr('href', this.uri)
				.text(this.title)
				.appendTo(li);
		});
	});
});
