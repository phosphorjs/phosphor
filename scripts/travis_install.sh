#!/bin/bash
npm install -g gulp
npm install -g typedoc
npm install -g tsd@next
npm install

echo "{\"token\": \"$GHTOKEN\"}" > ~/.tsdrc

if [ -d "$HOME/typings" ]; then
    cp -r $HOME/typings .
else:
    tsd reinstall -so
fi

cp -r typings $HOME
