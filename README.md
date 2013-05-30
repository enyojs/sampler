Enyo 2 Sampler
==============

A cross-platform application for viewing Enyo 2 samples from all its various libraries.

For the most recent released version, see the [Enyo JS website](http://enyojs.com/sampler).
The latest nightly build is also available at <http://nightly.enyojs.com/latest/sampler/debug.html>.

The app allows navigation through each library's samples.  Each sample is designed to be usable across all form factors, as a kind that can be rendered within the Sampler app, as well as standalone via the accompanying .html file.

You can inspect the current sample through the console via `window.sample`.

Since the app AJAX's in the JavaScript and CSS source files for the viewer, a few simple conventions must be followed to add new samples to the app:

* The `assets/manifest.json` file defines the left-hand navigation hierarchy of the app:
	* An entry with a `samples` array defines a nested menu.
	* An entry with a `path` string defines a sample at the path's location (omit the `.js` from the filename)
	* Optionally, a `css` string defines the base filename of a shared CSS file instead of defaulting to use a CSS file with the same name as the .js file.
* A sample must consist of one .js file containing a top-level kind of the same name as the file.  For example `ButtonSample.js` should contain (at least) a `ButtonSample` kind, which is the kind rendered into the right-hand panel of the app.
* By default, samples should define their css in a file with the same name as the kind (for example, `ButtonSample.css`).  However, by specifying the optional `css` parameter in the manifest, more than one smaple may share the same CSS file.
* Using this scheme, more than one sample .js file may be situated in the same folder, where they all share a sample.css file.
* When deploying the app, change the `sourcePath` variable in `assets/manifest.json` to point to a root directory containing un-minified versions of the `enyo` and `lib` directories (containing at least the samples).

URL Parameters
==============

The sampler can take additional parameters on the URL, added as arguments after a '?' character.

## addSamples=<path>[,<path>...]

This provides one or more additional paths from which to load samples. The path should be to a manifest.json
hosted in the new collection's folder.  Sampler will also try to load a package.js from the same folder
to pull in the sample source.  You can use this when testing a library to load its samples into the system
without having to add them to the sampler source. These paths are saved into local storage so they don't
have to be referenced in the future.

## sourcePath=<path>

This sets a path to load sample source from instead of the default manifest.
This paths is saved into local storage so it doesn't have to be referenced in the future.

## extras=1

This enables test mode, where you can go through each sample one-by-one.  It also lets you modify
the addSamples and sourcePath directly via a settings GUI and gives access to BrowserScope
test recording.

## reset=1

This clears previous paramameters stored in local storage.

Benchmarking
============

There are a couple of alternate index.html files that will load all of the standard samples and run them
as a JavaScript benchmark.  speedTest.html will load the minified source, while speedTestDebug.html
loads the full source from the trees.  Output of benchmark results goes to the debug console.

