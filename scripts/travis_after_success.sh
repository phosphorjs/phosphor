#!/bin/bash
if [[ $TRAVIS_PULL_REQUEST == false && $TRAVIS_BRANCH == "master" ]]
then
    echo "-- will build docs --"

    git config --global user.email "travis@travis-ci.com"
    git config --global user.name "Travis Bot"

    rm -rf build/docs/
    gulp docs

    git clone https://github.com/phosphorjs/phosphor.git travis_docs_build
    cd travis_docs_build
    git checkout gh-pages

    echo "https://${GHTOKEN}:@github.com" > .git/credentials
    git config credential.helper "store --file=.git/credentials"

    rm -rf ./*
    cp -r ../build/docs/* ./.
    git add -A
    git commit -m "autocommit docs"
    git push origin gh-pages
else
    echo "-- will only build docs from master --"
fi
