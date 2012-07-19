enyo.kind({
	name: "App",
	classes: "app onyx font-lato enyo-unselectable",
	samples:[],
	handlers: {
		onresize:"resized"
	},
	components: [
		{kind: "Panels", name:"mainPanels", classes:"panels enyo-fit", arrangerKind: "CollapsingArranger", components: [
			{kind: "Panels", name:"navPanels", arrangerKind:"CarouselArranger", onTransitionFinish:"navChanged", draggable:false, classes:"enyo-fit"},
			{kind: "Panels", name:"contentPanels", arrangerKind:"CollapsingArranger", draggable:false, classes:"panels enyo-fit", components:[
				{kind: "FittableRows", classes:"wide", components: [
					{kind:"Scroller", name:"sampleContent", horizontal: "hidden", fit:true, classes:"onyx enyo-unselectable", components:[
					]},
					{kind: "FittableColumns", name:"viewSourceToolbar", noStretch: true, classes: "onyx-toolbar onyx-toolbar-inline footer-toolbar", components: [
						{kind: "onyx.Grabber", ontap:"toggleFullScreen"},
						{fit:true}, // Spacer
						{kind: "onyx.Button", name:"viewSource", content: "View Source", ontap:"viewSource", showing:false},
						{kind: "onyx.Button", name:"openExternal", content: "Open", ontap:"openExternal", showing:false}
					]}
				]},
				{kind: "FittableRows", classes:"wide onyx", components: [
					{kind: "Panels", name:"sourcePanels", fit:true, draggable:false, components: [
						{kind: "Scroller", classes:"enyo-fit scroller", components: [
							{name:"sourceContent", classes:"source nowrap enyo-selectable"}
						]},
						{kind: "Scroller", classes:"enyo-fit scroller", components: [
							{name:"cssContent", classes:"source nowrap enyo-selectable"}
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
		//this.$.mainPanels.realtimeFit = !enyo.platform.touch;
	},
	loadSamples: function() {
		new enyo.Ajax({url: "assets/manifest.json"})
			.response(this, function(inSender, inSamples) {
				if (inSamples.sourcePath) {
					enyo.path.addPath("lib", inSamples.sourcePath + "/lib");
					enyo.path.addPath("enyo", inSamples.sourcePath + "/enyo");
				}
				inSamples.isTop = true;
				this.pushSampleList(inSamples);
			})
			.go();
	},
	rendered: function() {
		this.inherited(arguments);
	},
	pushSampleList: function(inSamples) {
		var index = this.$.navPanels.getIndex();
		// Pop off any previously viewed NavigationList to to the right of this one
		this.$.navPanels.setAnimate(false);
		for (var last=this.$.navPanels.getPanels().length-1; last > index; last--) {
			this.$.navPanels.getPanels()[last].destroy();
		}
		this.$.navPanels.setIndexDirect(index);
		this.$.navPanels.setAnimate(true);
		// Add a new NavigationList
		var navList = this.$.navPanels.createComponent(
			{kind:"NavigationList", 
				samples: inSamples, 
				onNavTap: "navTap", 
				onNavBack: "navBack"},
			{owner:this}
		);
		navList.render();
		this.$.navPanels.reflow();
		this.$.navPanels.next();
	},
	toggleFullScreen: function() {
		this.$.mainPanels.setIndex(this.$.mainPanels.index ? 0 : 1);
	},
	navTap: function(inSender, inEvent) {
		var sample = inSender.samples.samples[inEvent.index];
		this.resetSample();
		if (sample.samples) {
			this.pushSampleList(sample);
		}
		if (sample.path) {
			// Create a new sample kind instance inside sampleContent
			var kind = sample.path.substring(sample.path.lastIndexOf("/") + 1);
			var kindNamespace = sample.ns || this.currNamespace;
			var path = sample.path.substring(0, sample.path.lastIndexOf("/") + 1);
			var instance = this.$.sampleContent.createComponent({kind:(kindNamespace + "." + kind)});
			this.$.sampleContent.render();
			this.$.sampleContent.resized();
			// Load the source code for the sample
			this.externalURL = enyo.path.rewrite(sample.path + ".html");
			new enyo.Ajax({url: enyo.path.rewrite(sample.path + ".js"), handleAs:"text"})
				.response(this, function(inSender, inSource) {
					this.$.sourceContent.setContent(inSource);
				})
				.go();
			new enyo.Ajax({url: enyo.path.rewrite(path + (sample.css || kind) + ".css"), handleAs:"text"})
				.response(this, function(inSender, inSource) {
					this.$.cssContent.setContent(inSource);
				})
				.go();
			// Advance to the sample panel
			if (enyo.Panels.isScreenNarrow()) {
				this.$.mainPanels.next();
			}
			this.$.viewSource.show();
			this.$.openExternal.show();
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
	navChanged: function() {
		// Update the namespace used for samples without an explicit namespace
		var curr = this.$.navPanels.getActive();
		if (curr && curr.samples.ns) {
			this.currNamespace = curr.samples.ns;
		}
	},
	navBack: function() {
		this.$.navPanels.getActive().clearSelection();
		this.$.navPanels.previous();
		this.$.navPanels.getActive().clearSelection();
		this.resetSample();
	},
	resetSample: function() {
		this.$.sampleContent.destroyClientControls();
		this.$.sourceContent.setContent("");
		this.$.cssContent.setContent("");
		this.$.viewSource.hide();
		this.$.openExternal.hide();
	},
	viewSource: function() {
		this.$.contentPanels.setIndex(1);
	},
	openExternal: function() {
		window.open(this.externalURL, "_blank");
	},
	hideSource: function() {
		this.$.contentPanels.setIndex(0);
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

enyo.kind({
	name: "NavigationList",
	kind: "FittableRows", 
	classes:"enyo-fit",
	published: {
		samples:""
	},
	events: {
		onNavTap:"",
		onNavBack:""
	},
	components: [
		{kind: "onyx.Toolbar", style:"background-color:#555;"},
		{kind: "List", classes:"list", touch:true, fit:true, onSetupItem: "setupItem", components: [
			{name:"item", classes: "item enyo-border-box", ontap: "navTap"}
		]},
		{kind: "onyx.Toolbar", classes:"footer-toolbar", components: [
			{kind: "onyx.Button", name:"back", content:"Back", ontap:"navBack"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.samplesChanged();
	},
	samplesChanged: function() {
		this.$.toolbar.setContent(this.samples.name);
		this.$.back.setShowing(!this.samples.isTop);
		this.$.list.setCount(this.samples.samples.length); 
	},
	setupItem: function(inSender, inEvent) {
		var item = inSender.getClientControls()[0];
		item.setContent(this.samples.samples[inEvent.index].name);
		item.addRemoveClass("onyx-selected", inSender.isSelected(inEvent.index));
	},
	clearSelection: function() {
		if (this.selected !== undefined) {
			this.$.list.getSelection().deselect(this.selected);
		}
	},
	navTap: function(inSender, inEvent) {
		this.selected = inEvent.index;
		this.doNavTap(inEvent);
	},
	navBack: function(inSender, inEvent) {
		this.doNavBack(inEvent);
	}
});