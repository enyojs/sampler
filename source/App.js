enyo.kind({
	name: "App",
	classes: "app onyx font-lato enyo-unselectable",
	samples:[],
	handlers: {
		onresize:"resized"
	},
	components: [
		{kind: "Panels", name:"mainPanels", classes:"panels enyo-fit", arrangerKind: "CollapsingArranger", components: [
			{kind: "Panels", name:"navigation", arrangerKind:"CarouselArranger", classes:"enyo-fit"},
			{kind: "Panels", name:"contentPanels", arrangerKind:"CollapsingArranger", draggable:false, classes:"panels enyo-fit", components:[
				{kind: "FittableRows", classes:"wide", components: [
					{kind:"Scroller", name:"sampleContent", horizontal: "hidden", fit:true, classes:"onyx", components:[
					]},
					{kind: "FittableColumns", name:"viewSourceToolbar", noStretch: true, classes: "onyx-toolbar onyx-toolbar-inline footer-toolbar", components: [
						{kind: "onyx.Grabber", ontap:"toggleFullScreen"},
						{fit:true}, // Spacer
						{kind: "onyx.Button", name:"viewSource", content: "View Source", ontap:"viewSource", showing:false}
					]}
				]},
				{kind: "FittableRows", classes:"wide onyx", components: [
					{kind: "Panels", name:"sourcePanels", fit:true, draggable:false, components: [
						{kind: "Scroller", classes:"enyo-fit scroller", components: [
							{name:"sourceContent", classes:"source nowrap"}
						]},
						{kind: "Scroller", classes:"enyo-fit scroller", components: [
							{name:"cssContent", classes:"source nowrap"}
						]}
					]},
					{kind:"onyx.Toolbar", layoutKind: "FittableColumnsLayout", classes:"footer-toolbar", noStretch:true, components: [
						{kind: "onyx.Button", name:"srcCancelButton", content:"Close", ontap:"hideSource"},
						{kind: "onyx.IconButton", name:"srcCancelIcon", src:"assets/cancel.png", ontap:"hideSource"},
						{fit:true, style:"text-align:center;", components: [
							{kind: "onyx.RadioGroup", onActivate:"sourceChanged", components: [
								{content: "JS",  classes:"source-tabs", active: true},
								{content: "CSS", classes:"source-tabs"}
							]}
						]},
						{ components: [
							{kind: "onyx.Checkbox", onchange:"wrapChanged"},
							{content:"Wrap", classes:"enyo-inline wrap-label"}
						]}
					]}
				]}
			]}
		]}
	],
	create: function() {
		this.inherited(arguments);
		window.onhashchange = enyo.bind(this, "hashChange");
		this.loadSamples();
		this.resized();
		// Performance of realtime fit on mobile devices is usually poor
		this.$.mainPanels.realtimeFit = !enyo.platform.touch;
	},
	loadSamples: function() {
		new enyo.Ajax({url: "assets/manifest.json"})
			.response(this, function(inSender, inSamples) {
				if (inSamples.libPath) {
					enyo.path.addPath("lib", inSamples.libPath);
				}
				inSamples.samples.top = true;
				this.pushSampleList(inSamples.samples, "Enyo 2.0 Sampler");
			})
			.go();
	},
	rendered: function() {
		this.inherited(arguments);
	},
	pushSampleList: function(inSamples, name) {
		var index = this.$.navigation.getIndex();
		// Pop off any nav panels to the right of this one
		this.$.navigation.setAnimate(false);
		for (var last=this.$.navigation.getPanels().length-1; last > index; last--) {
			this.$.navigation.getPanels()[last].destroy();
		}
		this.$.navigation.setIndexDirect(index);
		this.$.navigation.setAnimate(true);
		var rows = this.$.navigation.createComponent(
			{kind: "FittableRows", classes:"enyo-fit", components: [
				{kind: "onyx.Toolbar", style:"background-color:#555;", content:name},
				{kind: "List", classes:"list", fit:true, onSetupItem: "setupItem", samples:inSamples, count:inSamples.length, components: [
					{classes: "item enyo-border-box", samples:inSamples, ontap: "navTap"}
				]},
				{kind: "onyx.Toolbar", classes:"footer-toolbar", components: [
					{kind: "onyx.Button", content:"Back", ontap:"navBack", showing:!inSamples.top }
				]}
			]},
			{owner:this}
		);
		rows.render();
		this.$.navigation.reflow();
		this.$.navigation.setIndex(index+1);
	},
	setupItem: function(inSender, inEvent) {
		var item = inSender.getClientControls()[0];
		item.setContent(inSender.samples[inEvent.index].name);
		item.addRemoveClass("onyx-selected", inSender.isSelected(inEvent.index));
	},
	toggleFullScreen: function() {
		this.$.mainPanels.setIndex(this.$.mainPanels.index ? 0 : 1);
	},
	navTap: function(inSender, inEvent) {
		var sample = inSender.samples[inEvent.index];
		this.resetSample();
		if (sample.samples) {
			this.pushSampleList(sample.samples, sample.name);
		}
		if (sample.path) {
			// Create a new sample kind instance inside sampleContent
			var kind = sample.path.substring(sample.path.lastIndexOf("/") + 1);
			var path = sample.path.substring(0, sample.path.lastIndexOf("/") + 1);
			var instance = this.$.sampleContent.createComponent({kind:kind});
			this.$.sampleContent.render();
			this.$.sampleContent.resized();
			// Load the source code for the sample
			new enyo.Ajax({url: enyo.path.rewrite(sample.path + ".js"), handleAs:"text"})
				.response(this, function(inSender, inSource) {
					this.$.sourceContent.setContent(inSource);
				})
				.go();
			new enyo.Ajax({url: enyo.path.rewrite(path + "sample.css"), handleAs:"text"})
				.response(this, function(inSender, inSource) {
					this.$.cssContent.setContent(inSource);
				})
				.go();
			// Advance to the sample panel
			if (enyo.Panels.isScreenNarrow()) {
				this.$.mainPanels.next();
			}
			this.$.viewSource.show();
			this.$.viewSourceToolbar.resized();
		}
		if (!sample.samples && !sample.path) {
			this.$.sampleContent.createComponent({content:"Sorry, no sample yet for \"" + sample.name + "\"."});
			this.$.sampleContent.render();
			// Advance to the sample panel
			if (enyo.Panels.isScreenNarrow()) {
				this.$.mainPanels.next();
			}
		}
	},
	resetSample: function() {
		this.$.sampleContent.destroyClientControls();
		this.$.sourceContent.setContent("");
		this.$.cssContent.setContent("");
		this.$.viewSource.hide();
		this.hideSource();
	},
	navBack: function() {
		this.resetSample();
		this.$.navigation.previous();
	},
	viewSource: function() {
		this.$.contentPanels.setIndex(1);
		//this.$.sourcePullout.animateTo(0);
	},
	hideSource: function() {
		this.$.contentPanels.setIndex(0);
		//this.$.sourcePullout.animateTo(100);
	},
	resized: function() {
		this.$.srcCancelButton.setShowing(!enyo.Panels.isScreenNarrow());
		this.$.srcCancelIcon.setShowing(enyo.Panels.isScreenNarrow());
	},
	sourceChanged: function(inSender, inEvent) {
		if (inEvent.originator.active) {
			this.$.sourcePanels.setIndex(inEvent.originator.indexInContainer());
		}
	},
	wrapChanged: function(inSender, inEvent) {
		this.$.sourceContent.addRemoveClass("nowrap", !inSender.getValue());
		this.$.cssContent.addRemoveClass("nowrap", !inSender.getValue());
	},
	getHashComponentName: function() {
		return window.location.hash.slice(1);
	},
	setHashComponentName: function(inName) {
		window.location.hash = inName;
	},
	hashChange: function() {
		var n = this.getHashComponentName();
	}
});
