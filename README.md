Enyo 2.0 Sampler
=========

A cross-platform application for viewing Enyo 2.0 samples from all its various libraries.

Since the app AJAX's in the JavaScript and CSS source files for the viewer, a few simple conventions must be followed to add new samples to the app:

* A sample must consist of one .js file containing a top-level kind of the same name as the file.  For example `ButtonSample.js` should contain (at least) a `ButtonSample` kind, which is the kind rendered into the right-hand panel of the app.
* Samples must define their css in a `sample.css` file in the same folder as the .js file.
* Using this scheme, more than one sample .js file may be situated in the same folder, where they all share a sample.css file.
* The `assets/manifest.json` file defines the left-hand navigation hierarchy of the app:
	* An entry with a `samples` array defines a nested menu.
	* An entry with a `path` string defines a sample at the path's location (omit the `.js` from the filename)
* When deploying the app, change the `libPath` variable in `assets/manifest.json` to point to an un-minified version of the lib directory (containing at least the samples).