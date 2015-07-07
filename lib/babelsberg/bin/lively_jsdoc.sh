#!/bin/bash
CWD="$(readlink -f `dirname "$0"`)"
cd $CWD/..

./node_modules/.bin/jsdoc -c jsdoc_conf.json -d docs

if [ "$TRAVIS_BRANCH" == "master" ]; then
    if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
	cd docs
	for f in *.html
	do
	    curl -T $f http://www.lively-kernel.org/babelsberg/docs/
	done
	find . -type f -exec echo '{}' \; -exec cat '{}' \;
	cd ..
    fi
fi
