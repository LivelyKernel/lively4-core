import Services from '../../templates/lively-services.js';
import {expect} from '../../node_modules/chai/chai.js';
import {testWorld, loadComponent} from './templates-fixture.js';

describe("Services Tool",  function() {
  var that;
  var listCount = 0, logCount = 0;
  var listRefreshed = false, logRefreshed = false;

  var checkListRefreshed = function(done) {
    if (listRefreshed) {
      return done();
    }
    if (++listCount > 8) {
      assert.fail(listRefreshed, true, 'Does not refresh list');
      return done();
    }
    setTimeout(function() {checkListRefreshed(done);}, 1000);
  };

  var checkLogRefreshed = function(done) {
    if (logRefreshed) {
      return done();
    }
    if (++logCount > 8) {
      assert.fail(logRefreshed, true, 'Does not refresh log');
      return done();
    }
    setTimeout(function() {checkLogRefreshed(done);}, 1000);
  };

  var getItems = function(c) {
    return that.serviceList.querySelectorAll('lively-services-item');
  };
 
  before("load", function(done){
    this.timeout(15000);
    loadComponent("lively-services").then(c => {
      that = c;
      that.refreshServiceList = function() { listRefreshed = true; };
      that.refreshLog = function() { logRefreshed = true; };
      done();
    });
  });

  after("unload", function(done) {
    that.unload();
    done();
  });
  
  it("should refresh automatically", function(done) {
    this.timeout(10000);
    checkListRefreshed(done);
  });
  
  it("should list, select, and remove services", function(done) {
    this.timeout(10000);
    var fakeServices = {
      '1': {
        'entryPoint': 'foo.js',
        'status': 0,
        'start': Date.now()
      },
      '42': {
        'entryPoint': 'bar.js',
        'status': 1,
        'start': Date.now()
      }
    };
    that.listServices(fakeServices);
    var items = getItems();
    expect(items.length).to.be.equal(2);

    items[1].click();

    var selected = that.removeAllItems();
    expect(selected).to.be.equal('42');

    items = getItems();
    expect(items.length).to.be.equal(0);

    that.listServices({});
    var emptyItem = that.serviceList.querySelectorAll('.empty');
    expect(emptyItem).to.not.be.null;

    checkLogRefreshed(done);
  });
  
  after("cleanup", function() {
    testWorld().innerHTML = "";
  });
});


