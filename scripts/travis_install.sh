#!/bin/bash
npm install -g gulp
npm install -g typedoc
npm install -g tsd@next
npm install

echo "{\"token\": \"$GHTOKEN\"}" > ~/.tsdrc

cp -r typings $HOME
