com.palm.app.enyo2sampler
=========================

Summary
-------
Enyo 2 Sampler Demo Application

Description
-----------
Enyo 2 Sampler Demo Application

Dependencies
============

## Installing

Once you have downloaded the source, enter the following to install it (after
changing into the directory under which it was downloaded):

    $ mkdir BUILD
    $ cd BUILD
    $ cmake ..
    $ sudo make install

The directory under which the files are installed defaults to `/usr/local/webos`.
You can install them elsewhere by supplying a value for `WEBOS_INSTALL_ROOT`
when invoking `cmake`. For example:

    $ cmake -D WEBOS_INSTALL_ROOT:PATH=$HOME/projects/webos ..
    $ make install

will install the files in subdirectories of `$HOME/projects/webos`.

Specifying `WEBOS_INSTALL_ROOT` also causes `pkg-config` to look in that tree
first before searching the standard locations. You can specify additional
directories to be searched prior to this one by setting the `PKG_CONFIG_PATH`
environment variable.

If not specified, `WEBOS_INSTALL_ROOT` defaults to `/usr/local/webos`.

## Uninstalling

From the directory where you originally ran `make install`, enter:

    $ [sudo] make uninstall

You will need to use `sudo` if you did not specify `WEBOS_INSTALL_ROOT`.

Copyright and License Information
=================================
Unless otherwise specified, all content, including all source code files and
documentation files in this repository are:

Copyright (c) 2008-2013 Hewlett-Packard Development Company, L.P.

Unless otherwise specified or set forth in the NOTICE file, all content,
including all source code files and documentation files in this repository are:
Confidential computer software. Valid license from HP required for
possession, use or copying.
