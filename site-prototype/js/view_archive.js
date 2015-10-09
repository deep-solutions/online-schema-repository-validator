$(document).ready(function () {
	var cdf_list = $('#archived-cdf-list').get(0);
	alert(cdf_list.outerHTML);
	$.get('/data/cdf_list.json', function (response) {
		var result = JSON.parse(response);
		alert(result);
		$.each(result, function () {
			alert("Iterate through CDFs!");
			var archs = this.archived;
			alert(archs);
			$.each(archs, function() {
				alert("Iterate through archived versions!");
				var li = $('<li/>')
					.appendTo(cdf_list);
				var a = $('<a/>')
					.attr('href', this.uri)
					.text(this.title + " (v" + this.version + ")")
					.appendTo(li);
			});
		});
	});
});
