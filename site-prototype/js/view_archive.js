$(document).ready(function () {
	var cdf_list = $('#archived-cdf-list').get(0);
	$.get('/data/cdf_list.json', function (response) {
		var result = JSON.parse(response);
		$.each(result, function () {
			if $.isEmptyObject(this.archived) {
				return;
			}
			else {
				var title = this.title;
				$.each(this.archived) {
					var li = $('<li/>')
						.appendTo(cdf_list);
					var a = $('<a/>')
						.attr('href', this.uri)
						.text(this.title + " v" + this.version)
						.appendTo(li);
				}
			}

		});
	});
});
