"use strict";

var expect = chai.expect;

describe('SWX Lively4 FS API', function() {
  it('should return all mounts for http://lively4/ magic url', function(done) {
    fetch("http://lively4/sys/mounts").then(r => r.text()).then( (text, err) => {
      if (err) done(err)
      var mounts = JSON.parse(text)
      console.log("mounts: ", mounts)
      expect(mounts).to.have.property("0") // find yourself!
      done()
    }).catch(done)
  });
});
