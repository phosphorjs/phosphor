#!/bin/bash
# make sure we have the typings
ls typings/codemirror || exit 1
gulp
gulp tests
./node_modules/.bin/karma start --browsers=Firefox tests/karma.conf.js
