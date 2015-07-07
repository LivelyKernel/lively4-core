#!/bin/bash
CWD="$(readlink -f `dirname "$0"`)"
cd $CWD/..

cd LivelyKernel

if [ -z $DISPLAY ]; then
    Xvfb :1 -screen 0 800x600x24 &
    export DISPLAY=:1
fi

npm install
node bin/lk-server --no-partsbin-check &
sleep 15
sed -i 's/var testList = baseTests;/var testList = [\"users.timfelgentreff.babelsberg.tests\", \"users.ohshima.ElectricalCircuitTests\", \"users.ohshima.ElectricalComponentsTests\", \"users.timfelgentreff.reactive.reactive_test\", \"users.timfelgentreff.z3.Z3BBBTests\", \"users.timfelgentreff.backtalk.tests\"]; browserTests = [];/' run_tests.js
npm test
exitcode=$?

if [ $exitcode -eq 0 ]; then
    if [ "$TRAVIS_BRANCH" == "master" ]; then
	if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.mini.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.mini.prototype.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.cassowary.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.core.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.csp.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.deltablue.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.sutherland.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.reactive.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.z3.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/z3/emz3/z3.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/z3/emz3/z3.js.map http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/z3/emz3/z3.js.mem http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.backtalk.js http://www.lively-kernel.org/babelsberg/
	fi
    fi
fi
exit $exitcode
