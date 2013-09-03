/*
	disableEnyoDom.js

	a bold hack to tear out the parts of Enyo that interact with the DOM to test JavaScript speed
*/

enyo.dom.setInnerHtml = enyo.nop;
enyo.dom.applyBodyFit = enyo.nop;

enyo.dom.byId = function(id) {
	return (typeof id == "string") ? null : id;
};

// disable code in enyo.Control that sets generated to true or creates nodes
enyo.Control.prototype.generateHtml = function() {
	if (this.canGenerate === false) {
		return '';
	}
	// do this first in case content generation affects outer html (styles or attributes)
	var c = this.generateInnerHtml();
	// generate tag, styles, attributes
	var h = this.generateOuterHtml(c);
	return h;
};

enyo.Control.prototype.renderNode = function() {
	this.teardownRender();
};

enyo.Control.prototype.write = function() {
	if (this.fit) {
		this.setupBodyFitting();
	}
	// for IE10 support, we want full support over touch actions in Enyo-rendered areas
	this.addClass("enyo-no-touch-action");
	// add css to enable hw-accelerated scrolling on non-Android platforms (ENYO-900, ENYO-901)
	this.setupOverflowScrolling();
	this.generateHtml();
	// post-rendering tasks
	if (this.generated) {
		this.rendered();
	}
	// support method chaining
	return this;
};
