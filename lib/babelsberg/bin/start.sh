#!/bin/bash
CWD="$(readlink -f `dirname "$0"`)"
cd $CWD/..

bin/lively_build.sh &&
cd LivelyKernel &&
npm start
