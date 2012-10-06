enyo.kind({
	name: "App",
	classes: "app onyx font-lato enyo-unselectable",
	samples:[],
	handlers: {
		onresize:"resized",
		onHideSampleSource:"hideSource"
	},
	browserScopeTestKey: "agt1YS1wcm9maWxlcnINCxIEVGVzdBjU2-gRDA",
	components: [
		{kind: "Panels", name:"mainPanels", classes:"panels enyo-fit", arrangerKind: "CollapsingArranger", components: [
			{kind: "ViewStack", name:"navPanels", onTransitionFinish:"navChanged", classes:"enyo-fit"},
			{kind: "Panels", name:"contentPanels", arrangerKind:"CollapsingArranger", draggable:false, classes:"panels enyo-fit", onTransitionFinish: "contentTransitionComplete", components: [
				{kind: "FittableRows", classes:"wide", components: [
					{kind:"Scroller", name:"sampleContent", horizontal: "hidden", fit:true, classes:"onyx enyo-unselectable", components:[
					]},
					{kind: "FittableColumns", name:"viewSourceToolbar", noStretch: true, classes: "onyx-toolbar onyx-toolbar-inline footer-toolbar", components: [
						{kind: "onyx.Grabber", ontap:"toggleFullScreen"},
						{fit:true}, // Spacer
						{kind: "onyx.Button", name:"viewSource", content: "View Source", ontap:"viewSource", showing:false},
						{kind: "onyx.Button", name:"openExternal", content: "Open", ontap:"openExternal", showing:false}
					]}
				]}
			]}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.parseQueryString();
		window.onhashchange = enyo.bind(this, "hashChange");
		this.loadSamples();
		this.resized();
	},
	loadSamples: function() {
		// Remove all navigation views
		this.$.navPanels.popAll();
		// Get the sample manifest
		new enyo.Ajax({url: "assets/manifest.json"})
			.response(this, function(inSender, inSamples) {
				// This is the root of the sample tree
				this.samples = inSamples;
				this.samples.isTop = true;
				// The path to find the JS/CSS source to display in the source viewer can
				// be specified in the manifest (or query string), which is useful when deploying
				var sourcePath = this.sourcePath || localStorage.getItem("sourcePath") || this.samples.sourcePath;
				if (sourcePath) {
					enyo.path.addPath("lib", sourcePath + "/lib");
					enyo.path.addPath("enyo", sourcePath + "/enyo");
				}
				// When using an explicit source path, we go ahead and
				// actually re-load the kind definitions from that location (tricky!)
				if (this.sourcePath || localStorage.getItem("sourcePath")) {
					this.loadSamplePackages(inSamples);
				}
				// We can specify additional sample manifests to add via a comma-separated
				// query string parameter which is stored in localStorage
				this.addSamples = enyo.json.parse(localStorage.getItem("addSamples"));
				this.loadAddSamples();
			})
			.go();
	},
	loadAddSamples: function() {
		if (this.addSamples && this.addSamples.length) {
			// Load any additional sample manifests one-by-one
			var addManifest = this.addSamples.shift();
			new enyo.Ajax({url: addManifest})
				.response(this, function(inSender, inSamples) {
					// To support manifests being on totally different servers, rewrite paths
					// relative to where this manifest lives
					var path = addManifest.substring(0, addManifest.lastIndexOf("/") + 1);
					this.aliasSamplePaths(inSamples, path + inSamples.sourcePath);
					// Additional sample manifests are pushed onto the end of the
					// master manifest list
					this.samples.samples.push(inSamples);
					// Since the source for addSamples were not included in the app's package.js, 
					// we need to runtime-load the source packages
					this.loadSamplePackages(inSamples);
					// Recurse, until the addSamples list is exhausted
					this.loadAddSamples();
				})
				.error(this, function() {
					this.loadAddSamples();
				})
				.go();
		} else {
			// All additional samples loaded; push the first sample menu
			this.pushSampleList(this.samples);
		}
	},
	aliasSamplePaths: function(inSamples, sourcePath) {
		if (inSamples.path) {
			inSamples.path = inSamples.path.replace(/\$lib/g, sourcePath + "/lib");
			inSamples.path = inSamples.path.replace(/\$enyo/g, sourcePath + "/enyo");
		}
		if (inSamples.loadPackages) {
			inSamples.loadPackages = inSamples.loadPackages.replace(/\$lib/g, sourcePath + "/lib");
			inSamples.loadPackages = inSamples.loadPackages.replace(/\$enyo/g, sourcePath + "/enyo");
		}
		if (inSamples.samples) {
			for (var i in inSamples.samples) {
				this.aliasSamplePaths(inSamples.samples[i], sourcePath);
			}
		}
	},
	loadSamplePackages: function(inSamples) {
		// Recurse over the samples tree and load the source for the samples
		if (inSamples.loadPackages) {
			var packages = inSamples.loadPackages.split(" ");
			enyo.log("Loading " + packages);
			enyo.load(packages);
		}
		if (inSamples.samples) {
			for (var i in inSamples.samples) {
				this.loadSamplePackages(inSamples.samples[i]);
			}
		}
	},
	parseQueryString: function() { 
		// Put query string into hash
		var queryString = {};
		var decode = function (s) { 
			return decodeURIComponent(s.replace(/\+/g, " ")); 
		};
		var q = location.search.substring(1); 
		if (!q.length) {
			return;
		}
		var keyValues = q.split('&');
		for (var i in keyValues) { 
			var key = keyValues[i].split('=');
			if (key.length > 1) {
				queryString[decode(key[0])] = decode(key[1]);
			}
		}
		// Handle items we care about (mostly moved into localStorage)
		if (queryString["addSamples"]) {
			localStorage.setItem("addSamples", enyo.json.stringify(queryString["addSamples"].split(",")));
		}
		if (queryString["jiraCollectorId"]) {
			localStorage.setItem("jiraCollectorId", queryString["jiraCollectorId"]);
		}
		if (queryString["sourcePath"]) {
			localStorage.setItem("sourcePath", queryString["sourcePath"]);
		}
		if (queryString["extras"] ||
			localStorage.getItem("addSamples") || 
			localStorage.getItem("jiraCollectorId") || 
			localStorage.getItem("sourcePath")) {
			localStorage.setItem("extras", "true");
		}
		if (queryString["reset"]) {
			localStorage.setItem("addSamples", "");
			localStorage.setItem("jiraCollectorId", ""); 
			localStorage.setItem("sourcePath", ""); 
			localStorage.setItem("extras", "");
		}
		if (!queryString["debug"]) {
			window.location = window.location.pathname;
		}
	},
	rendered: function() {
		this.inherited(arguments);
	},
	pushSampleList: function(inSamples) {
		// Add a new NavigationList
		this.$.navPanels.pushView(
			{kind:"NavigationList", 
				samples: inSamples, 
				onNavTap: "navTap", 
				onNavBack: "navBack",
				onMenuAction: "handleMenuAction",
				version: this.versionContent},
			{owner:this}
		);
	},
	toggleFullScreen: function() {
		this.$.mainPanels.setIndex(this.$.mainPanels.index ? 0 : 1);
	},
	navTap: function(inSender, inEvent) {
		var sample = inSender.samples.samples[inEvent.index];
		if (sample.samples) {
			this.pushSampleList(sample);
		}
		if (sample.path) {
			this.renderSample(sample);
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
	renderSample: function(sample) {
		// Create a new sample kind instance inside sampleContent
		this.resetSample();
		var kind = sample.path.substring(sample.path.lastIndexOf("/") + 1);
		var kindNamespace = sample.ns || this.currNamespace;
		var path = sample.path.substring(0, sample.path.lastIndexOf("/") + 1);
		var instance = this.$.sampleContent.createComponent({kind:(kindNamespace + "." + kind)});
		window.sample=instance;
		this.$.sampleContent.render();
		this.$.sampleContent.resized();
		// Load the source code for the sample
		this.externalURL = enyo.path.rewrite(sample.path + ".html");
		if ((this.externalURL.indexOf("http") != 0) || (this.externalURL.indexOf(window.location.origin) == 0)) {
			new enyo.Ajax({url: enyo.path.rewrite(sample.path + ".js"), handleAs:"text"})
				.response(this, function(inSender, inSource) {
					this.jsSource = inSource;
					var components = this.getComponents();
					for(var i=0;i<components.length;i++) {
						if(components[i].name == "sourceViewer") {
							this.$.sourceViewer.jsSource = inSource;
							this.$.sourceViewer.jsSourceChanged();
							break;
						}
					}
				})
				.go();
			new enyo.Ajax({url: enyo.path.rewrite(path + (sample.css || kind) + ".css"), handleAs:"text"})
				.response(this, function(inSender, inSource) {
					this.cssSource = inSource;
					var components = this.getComponents();
					for(var i=0, showingSource=false;i<components.length;i++) {
						if(components[i].name == "sourceViewer") {
							this.$.sourceViewer.cssSource = inSource;
							this.$.sourceViewer.cssSourceChanged();
							break;
						}
					}
				})
				.go();
		} else {
			this.$.jsContent.setContent("Sorry, the source for this sample is on a separate server and cannot be displayed due to cross-origin restrictions.");
			this.$.cssContent.setContent("Sorry, the source for this sample is on a separate server and cannot be displayed due to cross-origin restrictions.");
		}
		// Advance to the sample panel
		if (enyo.Panels.isScreenNarrow()) {
			this.$.mainPanels.next();
		}
		this.$.viewSource.show();
		this.$.openExternal.show();
		this.$.viewSourceToolbar.resized();
	},
	resized: function() {
		var components = this.getComponents();
		for(var i=0;i<components.length;i++) {
			if(components[i].name == "sourceViewer") {
				this.$.sourceViewer.resized();
				break;
			}
		}
	},
	navChanged: function() {
		// Update the namespace used for samples without an explicit namespace
		var curr = this.$.navPanels.getActive();
		if (curr && curr.samples && curr.samples.ns) {
			this.currNamespace = curr.samples.ns;
		}
	},
	navBack: function() {
		this.$.navPanels.popView();
		this.$.navPanels.getActive().clearSelection();
		this.resetSample();
	},
	resetSample: function() {
		this.$.sampleContent.destroyClientControls();
		this.$.viewSource.hide();
		this.$.openExternal.hide();
		window.sample = undefined;
	},
	viewSource: function() {
		var newComponent = this.$.contentPanels.createComponent({name: "sourceViewer", kind: "dynamicSourceViewer", jsSource: this.jsSource, cssSource: this.cssSource}, {owner: this});
		newComponent.jsSourceChanged();
		newComponent.cssSourceChanged();
		newComponent.render();
		this.$.contentPanels.render();
		this.$.contentPanels.setIndex(1);
	},
	hideSource: function() {
		this.hidingSource = true;
		this.$.contentPanels.setIndex(0);
	},
	contentTransitionComplete: function(inSender, inEvent) {
		if(this.hidingSource) {
			this.destroySourceViewer();
		}
	},
	destroySourceViewer: function() {
		this.$.sourceViewer.destroy();
		this.hidingSource = false;
	},
	openExternal: function() {
		window.open(this.externalURL, "_blank");
	},
	getHashComponentName: function() {
		return window.location.hash.slice(1);
	},
	setHashComponentName: function(inName) {
		window.location.hash = inName;
	},
	hashChange: function() {
		var n = this.getHashComponentName();
	},
	handleMenuAction: function(inSender, inEvent) {
		if (inEvent.action == "startTest") {
			this.$.navPanels.pushView(
				{ kind:"TestController", 
				  onQuit:"quitTest", 
				  onRenderSample:"renderTest", 
				  samples:this.samples,
				  browserScopeTestKey: this.browserScopeTestKey},
				{owner:this}
			);
		} else if (inEvent.action == "browserscope") {
			this.resetSample();
			var src = 'http://www.browserscope.org/user/tests/table/' + this.browserScopeTestKey + '?o=html&v=1';
			var style = "width:100%; height:100%; border:0px;";
			this.$.sampleContent.createComponent({tag:"iframe", src:src, style:style});
			this.$.sampleContent.render();
			this.$.sampleContent.resized();	
		} else if (inEvent.action == "switchNightly") {
			this.sourcePath = "http://nightly.enyojs.com/enyo-nightly-" + inEvent.version;
			this.versionContent = inEvent.content;
			this.loadSamples();
		} else if (inEvent.action == "settings") {
			this.$.navPanels.pushView(
				{kind:"SettingsView", onQuit:"quitTest"},
				{owner:this}
			);
		}
	},
	renderTest: function(inSender, inEvent) {
		this.renderSample(inEvent.sample);
	},
	quitTest: function() {
		this.resetSample();
		this.$.navPanels.popView();
	}
});

enyo.kind({
	name: "SourceView",
	kind: "Control",
	tag: "pre",
	classes: "source enyo-selectable",
	published: {
		wrap: false
	},
	create: function() {
		this.inherited(arguments);
		this.wrapChanged();
	},
	// IE8 normalizes whitespace when setting innerHTML even in <pre> tags, so appending
	// text nodes into the pre works around it (http://stackoverflow.com/a/195385)
	contentChanged: function(inOld) {
		var node = this.hasNode();
		if (node) {
			while(node.hasChildNodes()) { 
				node.removeChild(node.firstChild);
			}
			node.appendChild(document.createTextNode(this.content));
		}
	},
	wrapChanged: function(inOld) {
		this.addRemoveClass("nowrap", !this.wrap);
	}
});

enyo.kind({
	name: "dynamicSourceViewer",
	kind: "FittableRows",
	classes:"wide onyx",
	published: {
		jsSource: "",
		cssSource: ""
	},
	events: {
		onHideSampleSource: ""
	},
	components: [
		{kind: "Panels", name:"sourcePanels", fit:true, draggable:false, components: [
			{kind: "Scroller", classes:"enyo-fit scroller", components: [
				{kind:"SourceView", name:"jsContent" }
			]},
			{kind: "Scroller", classes:"enyo-fit scroller", components: [
				{kind:"SourceView", name:"cssContent"}
			]}
		]},
		{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", classes: "footer-toolbar", noStretch: true, components: [
			{kind: "onyx.Button", name: "srcCancelButton", content: "Close", ontap: "doHideSampleSource"},
			{kind: "onyx.IconButton", name: "srcCancelIcon", src: "assets/cancel.png", ontap: "doHideSampleSource"},
			{fit:true, style: "text-align:center;", components: [
				{kind: "onyx.RadioGroup", onActivate: "sourceChanged", components: [
					{content: "JS",  classes: "source-tabs", active: true},
					{content: "CSS", classes: "source-tabs"}
				]}
			]},
			{components: [
				{kind: "onyx.Checkbox", onchange: "wrapChanged"},
				{content: "Wrap", classes: "enyo-inline wrap-label"}
			]}
		]}
	],
	jsSourceChanged: function() {
		this.$.jsContent.setContent(this.getJsSource());
	},
	cssSourceChanged: function() { this.$.cssContent.setContent(this.getCssSource()); },
	sourceChanged: function(inSender, inEvent) {
		if (inEvent.originator.active) {
			this.$.sourcePanels.setIndex(inEvent.originator.indexInContainer());
		}
	},
	wrapChanged: function(inSender, inEvent) {
		this.$.jsContent.setWrap(inSender.getValue());
		this.$.cssContent.setWrap(inSender.getValue());
	},
	resized: function() {
		this.$.srcCancelButton.setShowing(!enyo.Panels.isScreenNarrow());
		this.$.srcCancelIcon.setShowing(enyo.Panels.isScreenNarrow());
	}
});

enyo.kind({
	name: "ViewStack",
	kind: "Panels",
	arrangerKind: "CarouselArranger",
	draggable: false,
	handlers: {
		onTransitionFinish: "transitionFinish"
	},
	currView: -1,
	transitionFinish: function() {
		// Suppress event while in the process of popping panels
		if (this.suppressFinish) {
			return true;
		}
		// When the last panel is greater than the current, we need to pop
		var last = this.getPanels().length - 1;
		if (last > this.currView) {
			this.suppressFinish = true;
			// Turn off animation, since panels will jump while destroying
			this.saveAnimate = this.getAnimate();
			this.setAnimate(false);
			// Pop any views in excess (to the right) of the current
			while (last > this.currView) {
				var view = this.getPanels()[last];
				view.destroy();
				last--;
			}
			// Go directly back to the current view and restore animation
			this.setIndexDirect(this.currView);
			this.setAnimate(this.saveAnimate);
			this.suppressFinish = false;
		}
	},
	pushView: function(inView, inOpts) {
		this.currView++;
		var c = this.createComponent(inView, inOpts);
		c.render();
		this.reflow();
		this.next();
		return c;
	},
	popView: function() {
		this.currView--;
		this.previous();
	},
	popToRootView: function(direct) {
		this.currView = 0;
		if (direct) {
			this.setIndexDirect(0);
		} else {
			this.setIndex(0);
		}
	},
	popAll: function() {
		this.saveAnimate = this.getAnimate();
		this.setAnimate(false);
		this.suppressFinish = true;
		var last = this.getPanels().length - 1;
		while (last > -1) {
			var view = this.getPanels()[last];
			view.destroy();
			last--;
		}
		this.setAnimate(this.saveAnimate);
		this.suppressFinish = false;
	}
});

enyo.kind({
	name: "NavigationList",
	kind: "FittableRows", 
	classes:"enyo-fit enyo-unselectable",
	published: {
		samples:""
	},
	events: {
		onNavTap:"",
		onNavBack:"",
		onMenuAction:""
	},
	components: [
		{kind: "onyx.Toolbar", style:"background-color:#555;"},
		{kind: "List", classes:"list", touch:true, fit:true, onSetupItem: "setupItem", components: [
			{name:"item", classes: "item enyo-border-box", ontap: "navTap"}
		]},
		{kind: "onyx.Toolbar", layoutKind:"FittableColumnsLayout", classes:"footer-toolbar", components: [
			{kind: "onyx.Button", name:"back", content:"Back", ontap:"doNavBack"},
			{fit:true},
			{kind: "onyx.MenuDecorator", name:"extrasMenu", showing:false, components: [
				{kind: "onyx.Button", content:"Extras"},
				{kind: "onyx.Menu", onSelect: "menuAction", floating:true, components: [
					{content:"Start Test Mode", action:"startTest"},
					{content:"Browserscope Results", action:"browserscope"},
					{kind:"onyx.PickerDecorator", components: [
						{kind: "onyx.MenuItem", content:"Switch to Nightly (experimental)"},
						{kind: "onyx.Picker", name:"nightlyPicker", modal:false, onSelect:"nightlyAction", floating:true}
					]},
					{content:"Settings", action:"settings"}
				]}
			]}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.samplesChanged();
		
		if (localStorage.getItem("extras") == "true") {
			this.$.extrasMenu.setShowing(true);
		}
		
		// Populate last 20 nightly dates
		var date = new Date();
		for (var i=0; i<20; i++) {
			var y = date.getFullYear();
			var m = date.getMonth() + 1;
			m = (m < 10) ? "0" + m : m;
			var d = date.getDate();
			d = (d < 10) ? "0" + d : d;
			var content = y + "/" + m + "/" + d;
			var version = y + "" + m + "" + d;
			this.$.nightlyPicker.createComponent({content:content, version:version});
			date = new Date(date.getTime() - (1000*60*60*24));
		}
	},
	menuAction: function(inSender, inEvent) {
		if (inEvent.originator.action) {
			this.doMenuAction({action:inEvent.originator.action});
		}
	},
	nightlyAction: function(inSender, inEvent) {
		this.doMenuAction({
			action:"switchNightly", 
			version:inEvent.originator.version,
			content:inEvent.originator.content});
		return true;
	},
	samplesChanged: function() {
		this.$.toolbar.setContent(this.samples.name + (this.version ? " (" + this.version + ")" : ""));
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
	startTest: function(inSender, inEvent) {
		this.doStartTest(inEvent);
	}
});

enyo.kind({
	name: "SettingsView",
	kind: "FittableRows", 
	events: {
		onQuit:"",
	},
	classes:"enyo-fit enyo-unselectable onyx",
	components: [
		{kind: "onyx.Toolbar", style:"background-color:#555;", content:"Settings"},
		{kind: "Scroller", fit:true, components: [
			{classes:"test-tools", components: [
				{kind:"onyx.Groupbox", name:"addSamplesGroup", components: [
					{kind: "onyx.GroupboxHeader", content:"Additional Samples"},
					{kind: "Repeater", style:"background:white;", name:"addSamplesList", onSetupItem:"setupManifest", components: [
						{kind:"onyx.InputDecorator", layoutKind:"FittableColumnsLayout", noStretch:true, components: [
							{kind:"onyx.Input", name:"manifestURL", onchange:"manifestChanged", fit:true},
							{kind:"onyx.IconButton", style:"width:32px;", src:"assets/remove-icon.png", ontap:"removeManifest"}
						]}
					]},
				]},
				{kind: "onyx.Button", content:"Add Samples", ontap:"addManifest", style:"margin-bottom:10px;"},
				{kind:"onyx.Groupbox", components: [
					{kind: "onyx.GroupboxHeader", content:"JIRA Collector ID"},
					{kind: "onyx.InputDecorator", layoutKind:"FittableColumnsLayout", noStretch:true, components: [
						{kind:"onyx.Input", name:"jiraCollectorId", fit:true},
					]}
				]},
				{kind:"onyx.Groupbox", components: [
					{kind: "onyx.GroupboxHeader", content:"Alternate Source Path"},
					{kind: "onyx.InputDecorator", layoutKind:"FittableColumnsLayout", noStretch:true, components: [
						{kind:"onyx.Input", placeholder:"(experimental)", name:"sourcePath", key:"sourcePath", fit:true},
					]}
				]}
			]}
		]},
		{kind: "onyx.Toolbar", layoutKind:"FittableColumnsLayout", classes:"footer-toolbar", components: [
			{kind: "onyx.Button", content:"Cancel", ontap:"doQuit"},
			{kind: "onyx.Button", content:"Save and Apply", ontap:"save"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.addSamples = enyo.json.parse(localStorage.getItem("addSamples")) || [];
		this.$.addSamplesList.setCount(this.addSamples.length);
		this.$.addSamplesGroup.setShowing(this.addSamples.length);
		this.$.sourcePath.setValue(localStorage.getItem("sourcePath"));
		this.$.jiraCollectorId.setValue(localStorage.getItem("jiraCollectorId"));
	},
	setupManifest: function(inSender, inEvent) {
		inEvent.item.$.manifestURL.setValue(this.addSamples[inEvent.index]);
	},
	removeManifest: function(inSender, inEvent) {
		this.addSamples.splice(inEvent.index, 1);
		this.$.addSamplesList.setCount(this.addSamples.length);
		this.$.addSamplesGroup.setShowing(this.addSamples.length);
	},
	addManifest: function() {
		this.addSamples.push("");
		this.$.addSamplesList.setCount(this.addSamples.length);
		this.$.addSamplesGroup.setShowing(this.addSamples.length);
	},
	manifestChanged: function(inSender, inEvent) {
		this.addSamples[inEvent.index] = inEvent.originator.getValue();
	},
	save: function() {
		localStorage.setItem("addSamples", enyo.json.stringify(this.addSamples));
		localStorage.setItem("sourcePath", this.$.sourcePath.getValue());
		localStorage.setItem("jiraCollectorId", this.$.jiraCollectorId.getValue());
		window.location = window.location.pathname;
	}
});

enyo.kind({
	name: "TestController",
	kind: "FittableRows", 
	events: {
		onQuit:"",
		onRenderSample:""
	},
	classes:"enyo-fit enyo-unselectable onyx",
	components: [
		{kind: "onyx.Toolbar", style:"background-color:#555;", content:"Sampler Test Mode"},
		{kind: "Scroller", fit:true, components: [
			{classes:"test-tools", components: [
				{components: [
					{kind:"onyx.Button", name:"prevBtn", classes:"test-button-left", content:"< Previous", ontap:"prevTest"},
					{kind:"onyx.Button", name:"nextBtn", classes:"test-button-right", content:"Next >", ontap:"nextTest"}
				]},
				{kind:"onyx.Groupbox", components: [
					{kind: "onyx.GroupboxHeader", content:"Sample"},
					{kind: "onyx.PickerDecorator", name:"samplePickerDec", onSelect:"sampleChanged", components: [
						{name:"sampleName", style:"padding:10px; background:white; width:100%; text-align:left;", content: "Sample Name"},
						{name:"samplePicker", style:"width:100%", kind:"onyx.FlyweightPicker", onSetupItem:"setupPicker", components: [
							{name:"pickerItem", style:"text-align:left;"}
						]}
					]}
				]},
				{components: [
					{kind:"onyx.Button", name:"failBtn", content:"Fail", classes:"onyx-negative test-button-left", ontap:"failTest"},
					{kind:"onyx.Button", name:"passBtn", content:"Pass", classes:"onyx-affirmative test-button-right", ontap:"passTest"}
				]},
				{kind:"onyx.Groupbox", name:"resultGroup", components: [
					{kind: "onyx.GroupboxHeader", content:"Test Result"},
					{name:"resultValue", style:"padding:10px; background:white;", content: "Pass"}
				]},
				{kind:"onyx.Groupbox", name:"descGroup", components: [
					{kind: "onyx.GroupboxHeader", content:"Fail Description"},
					{kind: "onyx.InputDecorator", components: [
						{kind: "onyx.TextArea", name:"descText", style: "width: 100%;", oninput:"descChanged"},
					]}
				]},
				{components: [
					{kind:"onyx.Button", name:"cancelBtn", content:"Cancel", classes:"test-button-left", ontap:"cancelFail"},
					{kind:"onyx.Button", name:"confirmBtn", content:"Confirm Failure", classes:"onyx-negative test-button-right", ontap:"confirmFail"}
				]},
				{kind:"onyx.Groupbox", name:"knownIssues", showing:false, components: [
					{kind: "onyx.GroupboxHeader", content:"Known Issues"},
					{kind: "Repeater", style:"background:white;", name:"knownIssuesList", onSetupItem:"setupKnownIssues", components: [
						{name:"item", style:"padding:10px; font-size:12px;", components: [
							{tag:"a", name:"issueKey", style:"width:75px; padding-right:10px; color:blue;"},
							{tag:"span", name:"issueSummary"}
						]}
					]}
				]}
			]}
		]},
		{kind: "onyx.Toolbar", classes:"footer-toolbar", components: [
			{kind: "onyx.Button", name:"back", content:"Done", ontap:"doneTapped"}
		]},
		{name: "donePopup", style:"width:250px;padding:10px;", kind: "onyx.Popup", centered: true, modal: true, floating: true, scrim:true, components: [
			{style:"padding-bottom:10px;", content: "Would you like to report your test results to Browserscope?"},
			{kind: "onyx.Button", name:"discardBtn", classes:"onyx-negative", content: "No, Discard", ontap: "dismissDone"},
			{kind: "onyx.Button", name:"reportBtn", classes:"onyx-affirmative", content: "Yes, Report", ontap: "dismissDone"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.results = [];
		this.resultsChanged = false;
		this.sampleList = [];
		this.currSample = -1;
		this.populateSampleList(this.samples.samples);
		this.$.samplePicker.setCount(this.sampleList.length);
		this.jiraCollectorId = localStorage.getItem("jiraCollectorId");
		if (this.jiraCollectorId) {
			this.loadJIRACollector(this.jiraCollectorId);
		}
		this.nextTest();
	},
	loadJIRACollector: function(jiraCollectorId) {
		if (!document.getElementById("_jira_collector")) {
			var newScript = document.createElement('script');
			newScript.id = "_jira_collector";
			firstScript = document.getElementsByTagName('script')[0];
			newScript.src = "https://enyojs.atlassian.net/s/en_USx1agvx-418945332/801/41/1.1/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector.js?collectorId=" + jiraCollectorId;
			firstScript.parentNode.insertBefore(newScript, firstScript);
		}
	},
	populateSampleList: function(samples, ns) {
		for (var i in samples) {
			var sample = samples[i];
			if (sample.samples) {
				this.populateSampleList(sample.samples, sample.ns || ns);
			} else if (sample.path) {
				sample.ns = ns;
				this.sampleList.push(sample);
			}
		}
	},
	pickerNameForSample: function(index) {
		var sample = this.sampleList[index];
		return (index+1) + "/" + this.sampleList.length + ": " + sample.name;
	},
	setupPicker: function(inSender, inEvent) {
		this.$.pickerItem.setContent(this.pickerNameForSample(inEvent.index));
	},
	sampleChanged: function(inSender, inEvent) {
		this.currSample = inEvent ? inEvent.originator.selected : 0;
		this.selectSample(this.sampleList[this.currSample]);
	},
	nextTest: function() {
		if (this.currSample < (this.sampleList.length-1)) {
			this.currSample++;
			this.$.samplePicker.setSelected(this.currSample);
			this.selectSample(this.sampleList[this.currSample]);
		}
	},
	prevTest: function() {
		if (this.currSample > 0) {
			this.currSample--;
			this.$.samplePicker.setSelected(this.currSample);
			this.selectSample(this.sampleList[this.currSample]);
		}
	},
	selectSample: function(sample) {
		this.$.descGroup.hide();
		this.$.cancelBtn.hide();
		this.$.confirmBtn.hide();
		this.$.knownIssues.hide();
		var currResult = this.results[this.currSample];
		this.$.resultGroup.setShowing(currResult);
		this.$.resultValue.setContent(currResult ? (currResult.result ? "Pass" : "Fail" ) : "");
		this.$.descGroup.setShowing(currResult && currResult.failDesc);
		this.$.descText.setValue(currResult ? currResult.failDesc : "");
		this.$.pickerItem.setContent(this.pickerNameForSample(this.currSample));
		this.$.sampleName.setContent(this.pickerNameForSample(this.currSample));
		this.doRenderSample({sample:sample});
		this.$.nextBtn.setDisabled(this.currSample == (this.sampleList.length-1));
		this.$.prevBtn.setDisabled(this.currSample == 0);
		
		// Query JIRA for known issues
		var ids = sample.name.match("ENYO-[0-9]+");
		ids = (ids && ids.length) ? " OR ((id=" + ids.join(") OR (id=") + "))" : "";
		var keywords = "+" + sample.name.replace(/ /g, " +").replace(":","");
		var jql = '(summary ~ "' + keywords + '" and status in ("Open", "In Progress"))' + ids;
		var request = new enyo.JsonpRequest({
			url: "https://enyojs.atlassian.net/rest/api/latest/search",
			callbackName: "jsonp-callback"
		});
		request.go({jql: jql});
		request.response(this, "processKnownIssues");
	},
	processKnownIssues: function(inSender, inResponse) {
		this.knownIssues = inResponse.issues;
		this.$.knownIssues.setShowing(this.knownIssues.length);
		this.$.knownIssuesList.setCount(this.knownIssues.length);
	},
	setupKnownIssues: function(inSender, inEvent) {
		var item = inEvent.item;
		var issue = this.knownIssues[inEvent.index];
		item.$.issueKey.setContent(issue.key);
		item.$.issueKey.setAttributes({href:"https://enyojs.atlassian.net/browse/" + issue.key, target:"_top"});
		item.$.issueSummary.setContent(issue.fields.summary);
	},
	descChanged: function() {
		this.$.confirmBtn.setDisabled(this.$.descText.getValue().length == 0);
	},
	passTest: function() {
		this.results[this.currSample] = {result: 1};
		this.resultsChanged = true;
		this.$.resultGroup.setShowing(true);
		this.$.resultValue.setContent("Pass");
		this.nextTest();
	},
	failTest: function() {
		if (this.jiraCollectorId) {
			window._jira_collector_trigger();
		}
		/*
		this.$.descGroup.show();
		this.$.cancelBtn.show();
		this.$.confirmBtn.show();
		this.$.descText.hasNode().focus();
		*/
		this.confirmFail();
	},
	cancelFail: function() {
		this.$.descGroup.hide();
		this.$.cancelBtn.hide();
		this.$.confirmBtn.hide();
	},
	confirmFail: function() {
		this.results[this.currSample] = {result: 0, failDesc: this.$.descText.getValue()};
		this.resultsChanged = true;
		this.$.resultGroup.setShowing(true);
		this.$.resultValue.setContent("Fail");
		//this.nextTest();
	},
	doneTapped: function() {
		if (this.resultsChanged) {
			this.$.donePopup.show();
		} else {
			this.doQuit();
		}
	},
	dismissDone: function(inSender) {
		if (inSender == this.$.reportBtn) {
			this.reportResults();
		}
		this.$.donePopup.hide();
		this.doQuit();
	},
	reportResults: function() {
		window._bTestResults = {};
		for (var i in this.results) {
			if (this.results[i]) {
				var name = this.sampleList[i].name; //.replace(/ /g, "_");
				window._bTestResults[name] = this.results[i].result;
			}
		}
		var sandboxId = '';
		var newScript = document.createElement('script'),
		firstScript = document.getElementsByTagName('script')[0];
		newScript.src = 'http://www.browserscope.org/user/beacon/' + this.browserScopeTestKey;
		if (sandboxId) {
			newScript.src += '?sandboxid=' + sandboxId;
		}
		firstScript.parentNode.insertBefore(newScript, firstScript);
  	}
});