/* global console:true */
(function() {
	var buffer = "";

	console.log = function() {
		var a$ = Array.prototype.slice.call(arguments);
		buffer += a$.join(" ") + "\r\n";
	};
	console.warn = function() {
		var a$ = Array.prototype.slice.call(arguments);
		buffer += "WARNING: " + a$.join(" ") + "\r\n";
	};
	console.error = function() {
		var a$ = Array.prototype.slice.call(arguments);
		buffer += "ERROR: " + a$.join(" ") + "\r\n";
	};
	console.getBuffer = function() {
		return buffer;
	};
})();