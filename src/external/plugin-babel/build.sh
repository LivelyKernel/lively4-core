#!/bin/bash -xv

NODE_CWD=./node_modules/.bin

BUILD_DIR=build-babel
JSPM_VERSION=beta

REGENERATOR_VERSION=0.10.1

cd $BUILD_DIR
cp -r jspm_packages_override/* jspm_packages

jspm build systemjs-babel.js ../systemjs-babel-browser.js --format amd --skip-source-maps --skip-rollup --minify --log ok
jspm build systemjs-babel.js ../systemjs-babel-node.js --format amd --node --skip-source-maps --skip-rollup --log ok
jspm run systemjs-build-babel-helpers.js > ../babel-helpers.js
jspm run systemjs-build-modular-babel-helpers.js
(
  echo "export default (function(module) {" ;
  cat jspm_packages/npm/regenerator-runtime@$REGENERATOR_VERSION/runtime.js
  echo "return module.exports; })({exports:{}});"
) > ../regenerator-runtime.js
cd ..
