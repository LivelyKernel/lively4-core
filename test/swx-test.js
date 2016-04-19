"use strict";
import {expect} from '../node_modules/chai/chai.js'

describe('SWX Lively4 FS API', function() {
  it('should return all mounts for http://lively4/ magic url', async () => {
    var text = await fetch("http://lively4/sys/mounts").then(r => r.text())
    try {
      var mounts = JSON.parse(text)
    } catch(e) {
      throw new Error("Could not parse: " + text)
    }
    expect(mounts).to.have.property("0") // find yourself!
  });
});
