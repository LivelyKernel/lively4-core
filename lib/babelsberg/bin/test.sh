#!/bin/bash
CWD="$(readlink -f `dirname "$0"`)"
cd $CWD/..

bin/lively_build.sh &&
bin/lively_test.sh &&
bin/node_test.sh &&
bin/lint.sh
exit $?
