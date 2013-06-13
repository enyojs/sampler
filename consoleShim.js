/* global console:true */
(function() {
	var buffer = "";
	var originalLog = console.log;
	var originalWarn = console.warn;
	var originalError = console.error;

	console.log = function() {
		var a$ = Array.prototype.slice.call(arguments);
		buffer += Date.now() + " " + a$.join(" ") + "\r\n";
		originalLog.apply(console, arguments);
	};
	console.warn = function() {
		var a$ = Array.prototype.slice.call(arguments);
		buffer += Date.now() + " WARNING: " + a$.join(" ") + "\r\n";
		originalWarn.apply(console, arguments);
	};
	console.error = function() {
		var a$ = Array.prototype.slice.call(arguments);
		buffer += Date.now() + " ERROR: " + a$.join(" ") + "\r\n";
		originalError.apply(console, arguments);
	};
	console.getBuffer = function() {
		return buffer;
	};
})();