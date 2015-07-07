#!/bin/bash
CWD="$(readlink -f `dirname "$0"`)"
cd $CWD/..

if [ -d LivelyKernel ]; then
    cd LivelyKernel
    git co -- run_tests.js
    git pull
else
    git clone git://github.com/LivelyKernel/LivelyKernel.git
    mkdir LivelyKernel/users
    ln -s $PWD LivelyKernel/users/timfelgentreff
    ln -s $PWD/ohshima LivelyKernel/users/ohshima
fi

