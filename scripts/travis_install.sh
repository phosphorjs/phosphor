#!/bin/bash
npm install -g gulp
npm install -g typedoc
npm install -g tsd@next
npm install

echo "{\"token\": \"$GHTOKEN\"}" > ~/.tsdrc

# Pull typings from the cache and attempt to get latest
cp -r $HOME/typings .
tsd reinstall -so; true

# install Karma test suite and modules
npm install karma
npm install karma-mocha
npm install karma-firefox-launcher
