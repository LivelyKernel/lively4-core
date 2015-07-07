#!/bin/bash
CWD="$(readlink -f `dirname "$0"`)"
cd $CWD/..

node standalone/zombietest.js
exitcode=$?
exit $exitcode
