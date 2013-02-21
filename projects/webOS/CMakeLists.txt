# @@@LICENSE
#
# (c) Copyright 2013  Hewlett-Packard Development Company, L.P.
#
# Confidential computer software. Valid license from HP required for
# possession, use or copying. Consistent with FAR 12.211 and 12.212,
# Commercial Computer Software, Computer Software Documentation, and
# Technical Data for Commercial Items are licensed to the U.S. Government
# under vendor's standard commercial license.
#
# LICENSE@@@
cmake_minimum_required(VERSION 2.8.7)
project(com.palm.app.enyo2sampler NONE)
include(webOS/webOS)
webos_modules_init(1 0 0 QUALIFIER RC4)
webos_component(2 0 0)

set(INSTALL_DIR ${WEBOS_INSTALL_WEBOS_APPLICATIONSDIR}/${CMAKE_PROJECT_NAME})
#install necessary files to destination directory
install(DIRECTORY . DESTINATION ${INSTALL_DIR}
        PATTERN "*~" EXCLUDE
        PATTERN "CMake*" EXCLUDE
        PATTERN "mock" EXCLUDE
        PATTERN "BUILD*" EXCLUDE
        PATTERN "patches" EXCLUDE
        PATTERN ".git*" EXCLUDE
        PATTERN ".project" EXCLUDE)

