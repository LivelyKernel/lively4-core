#!/bin/bash

while(true); do 
    ~/lively4-core/bin/syncgithub.sh ~/lively4-core
    ~/lively4-core/bin/syncgithub.sh ~/lively4-core/Wiki
    sleep 600
done