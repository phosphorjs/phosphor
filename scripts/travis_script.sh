#!/bin/bash
gulp
gulp tests
./node_modules/.bin/karma start --browsers=Firefox
