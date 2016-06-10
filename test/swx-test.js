"use strict";
import {expect} from '../node_modules/chai/chai.js'

describe('SWX Lively4 FS API', function() {
  xit('should return all mounts for http://lively4/ magic url',  (done) => {
    fetch(document.location.protocol + "//lively4/sys/mounts").then(r => r.text()).then( text => {
      try {
        var mounts = JSON.parse(text)
      } catch(e) {
        done(new Error("Could not parse: " + text))
      }
      expect(mounts).to.have.property("0") // find yourself!
      done()
    })
  });
});

console.log("loaded")
