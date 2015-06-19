#!/bin/bash
set -x
npm install -g gulp
npm install -g typedoc
npm install -g tsd@next
npm install

echo "{\"token\": \"$GHTOKEN\"}" > ~/.tsdrc

cp -r $HOME/typings .


npm install karma
npm install karma-mocha
npm install karma-firefox-launcher
