#!/bin/bash
set -e
gulp
gulp tests
./node_modules/.bin/karma start --browsers=Firefox tests/karma.conf.js
