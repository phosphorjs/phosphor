#!/bin/bash
# make sure we have the typings
ls typings/codemirror  
gulp
gulp tests
./node_modules/.bin/karma start --browsers=Firefox tests/karma.conf.js
