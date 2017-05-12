import {expect} from '../../node_modules/chai/chai.js';
import {MockEvent, createHTML, testWorld, loadComponent} from './templates-fixture.js';
import {pt,rect} from 'src/client/graphics.js';

import LivelyTable from "templates/lively-table.js"

function fillTableWithNumber(table) {
  table.innerHTML = ""
  table.setFromArray([
      ["A", "B", "C", "D"],
      ["1", "2", "3", "4"],
      ["one", "two", "three", "four"]])
}


describe("LivelyTable Component",  () => {

  var that;
  before("load",  function(done) {
    this.timeout(35000);
    var templateName = "lively-table";
    loadComponent(templateName).then(c => {
      that = c;
      done();
    }).catch(e => done(e));
  });


  describe("Array",  () => {
    it("shouuld set array contents", done => {
      that.setFromArray([["hello", "world"],["one", "two"]])
      expect(that.innerHTML).to.match(/hello/)
      expect(that.querySelectorAll("td").length).to.equal(2)
      done()
    });
    it("shouuld get contents as array", done => {
      that.setFromArray([["hello", "world"],["one", "two"]])
      var a = that.asArray()
      expect(a[0][0]).to.equal("hello")
      expect(a.length).to.equal(2)
      done()
    });
  })

  describe("JSO",  () => {
    it("shouuld set jso contents", done => {
      that.innerHTML = ""
      that.setFromJSO([{json_hello: "json_one", world: "two"}, {world: "uno", hello: "dos"}, {world: "zwei"}])
      var a = that.asArray()
      expect(a[0][0]).to.equal("json_hello")
      expect(a[1][0]).to.equal("json_one")
      done()
    });
    it("shouuld get contents as jso", done => {
      that.innerHTML = ""
      that.setFromArray([["hello", "world"],["uno", "dos"]])
      var a = that.asJSO()
      expect(a[0].hello).to.equal("uno")
      done()
    });
  })

  describe("CSV",  () => {
    it("shouuld set CSV contents", done => {
      that.setFromCSV("a;b;c\n1;2;3\neins;zwei")
      var a = that.asArray()
      expect(a[0][0]).to.equal("a")
      expect(a[1][0]).to.equal("1")
      expect(a[2][1]).to.equal("zwei")
      done()
    });
    it("shouuld get contents as csv", done => {
      that.setFromArray([["hello", "world"],["one", "two"]])
      var s = that.asCSV()
      expect(s).to.match(/hello;world\none;two/)
      done()
    });
  })
  
  describe("Selection",  () => {
    it("should sellect a cell", done => {
      fillTableWithNumber(that)
      expect(that.currentCell).to.equal(undefined)
      var cell = that.cellAt(1,2)
      that.selectCell(cell)
      expect(that.currentCell.textContent).to.equal("two")
      done()
    });
    
    it("should sellect a two cells on SHIFT + left", done => {
      fillTableWithNumber(that)
      that.selectCell(that.cellAt(1,2))
      that.onLeftDown(new MockEvent(that, {shiftKey: true})) 
      expect(that.selectedCells.length).to.equal(2)
      done()
    });
   
   
    // #TODO #Continue here...  
    // it("should sellect a four cells on SHIFT + left and SHIFT + down", done => {
    //   fillTableWithNumber(that)
    //   that.selectCell(that.cellAt(2,1))
    //   that.onLeftDown(new MockEvent(that, {shiftKey: true})) 
    //   that.onDownDown(new MockEvent(that, {shiftKey: true})) 
    //   expect(that.selectedCells.length).to.equal(4)
    //   done()
    // });
    
    
  })
  
  describe("Navigation",  () => {
    it("should navigate left", done => {
      fillTableWithNumber(that)
      that.selectCell(that.cellAt(1,2))
      expect(that.currentColumnIndex).to.equal(1)
      that.onLeftDown(new MockEvent(that)) 
      expect(that.currentColumnIndex).to.equal(0)
      done()
    });
    it("should navigate right", done => {
      fillTableWithNumber(that)
      that.selectCell(that.cellAt(1,2))
      that.onRightDown(new MockEvent(that)) 
      expect(that.currentColumnIndex).to.equal(2)
      done()
    });
    it("should navigate up", done => {
      fillTableWithNumber(that)
      that.selectCell(that.cellAt(1,2))
      expect(that.currentRowIndex).to.equal(2)
      that.onUpDown(new MockEvent(that)) 
      expect(that.currentRowIndex).to.equal(1)
      done()
    });
    it("should navigate down", done => {
      fillTableWithNumber(that)
      that.selectCell(that.cellAt(1,2))
      expect(that.currentRowIndex).to.equal(2)
      that.onUpDown(new MockEvent(that)) 
      expect(that.currentRowIndex).to.equal(1)
      done()
    });

  })
  
  after("cleanup", () => {
    testWorld().innerHTML = "";
  });
});
