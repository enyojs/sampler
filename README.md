Enyo 2.0 Sampler
=========

A cross-platform application for viewing Enyo 2.0 samples from all its various libraries.

The app allows navigation through each library's samples.  Each sample is designed to be usable across all form factors, as a kind that can be rendered within the Sampler app, as well as standalone via the accompanying .html file.

Since the app AJAX's in the JavaScript and CSS source files for the viewer, a few simple conventions must be followed to add new samples to the app:

* The `assets/manifest.json` file defines the left-hand navigation hierarchy of the app:
	* An entry with a `samples` array defines a nested menu.
	* An entry with a `path` string defines a sample at the path's location (omit the `.js` from the filename)
	* Optionally, a `css` string defines the base filename of a shared CSS file instead of defaulting to use a CSS file with the same name as the .js file.
* A sample must consist of one .js file containing a top-level kind of the same name as the file.  For example `ButtonSample.js` should contain (at least) a `ButtonSample` kind, which is the kind rendered into the right-hand panel of the app.
* By default, samples should define their css in a file with the same name as the kind (for example, `ButtonSample.css`).  However, by specifying the optional `css` parameter in the manifest, more than one smaple may share the same CSS file.
* Using this scheme, more than one sample .js file may be situated in the same folder, where they all share a sample.css file.
* When deploying the app, change the `sourcePath` variable in `assets/manifest.json` to point to a root directory containing un-minified versions of the `enyo` and `lib` directories (containing at least the samples).