#!/bin/sh

LIVELY=~/lively4-core
SERVER=~/lively4-server

cd $LIVELY
while true; do
    echo "restart http server"`date`  | tee $LIVELY/server.log;
    node $SERVER/httpServer.js --directory=$LIVELY4 --port=9090 | tee $LIVELY/server.log;
done
