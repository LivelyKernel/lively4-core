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
  table.clearSelection()
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
    it("should set array contents", done => {
      that.setFromArray([["hello", "world"],["one", "two"]])
      expect(that.innerHTML).to.match(/hello/)
      expect(that.querySelectorAll("td").length).to.equal(2)
      done()
    });
    it("should set contents as array", done => {
      that.setFromArray([["hello", "world"],["one", "two"]])
      var a = that.asArray()
      expect(a[0][0]).to.equal("hello")
      expect(a.length).to.equal(2)
      done()
    });
    it("should set contents as array preseve formatting", done => {
      that.setFromArray([["hello", "world"],["one", "two"]])
      var cells1 = that.cells() 
      that.setFromArray([["hello2", "world2"],["one2", "two2"]])
      var cells2 = that.cells() 
      expect(cells1[0][0]).to.equal(cells2[0][0])
      done()
    });

    it("should set contents as array at position", done => {
      that.setFromArray([[1, 2, 3, 4],["a", "b", "c", "d"],["A", "B", "C", "D"]])
      that.setFromArrayAt([["hello", "world"],["one", "two"]], 1,1)
      var a = that.asArray()
      expect(a[0][0]).to.equal("1")
      expect(a[1][1]).to.equal("hello")
      expect(a[2][1]).to.equal("one")
      done()
    });

    it("should set contents as array at position should grow table", done => {
      that.setFromArray([[1, 2, 3, 4],["a", "b", "c", "d"],["A", "B", "C", "D"]])
      that.setFromArrayAt([["hello", "world"],["one", "two"],["uno", "dos"],["un", "deux"]], 1,1)
      var a = that.asArray()
      expect(a[4][1]).to.equal("un")
      done()
    });

    it("should set contents as array at position should grow table (wider)", done => {
      that.setFromArray([[1, 2],["a", "b"],["A", "B"]])
      that.setFromArrayAt([["hello", "world","how","are","you"]], 1,1)
      var a = that.asArray()
      expect(a[1][3]).to.equal("how")
      expect(a[2][3], "empty cell").to.equal("")
      done()
    });


    it("should set contents as array at position amd keep cell elements", done => {
      that.setFromArray([[1, 2, 3, 4],["a", "b", "c", "d"],["A", "B", "C", "D"]])
      var cellA = that.cellAt(0,0)
      that.setFromArrayAt([["hello", "world"],["one", "two"]], 1,1)
      var cellB = that.cellAt(0,0)
      expect(cellA).to.equal(cellB)
      done()
    });

  })

  describe("JSO",  () => {
    it("should set jso contents", done => {
      that.innerHTML = ""
      that.setFromJSO([{json_hello: "json_one", world: "two"}, {world: "uno", hello: "dos"}, {world: "zwei"}])
      var a = that.asArray()
      expect(a[0][0]).to.equal("json_hello")
      expect(a[1][0]).to.equal("json_one")
      done()
    });
    it("should get contents as jso", done => {
      that.innerHTML = ""
      that.setFromArray([["hello", "world"],["uno", "dos"]])
      var a = that.asJSO()
      expect(a[0].hello).to.equal("uno")
      done()
    });
  })

  describe("CSV",  () => {
    it("shouuld set CSV contents", done => {
      that.setFromCSV("a\tb\tc\n1\t2\t3\neins\tzwei")
      var a = that.asArray()
      expect(a[0][0]).to.equal("a")
      expect(a[1][0]).to.equal("1")
      expect(a[2][1]).to.equal("zwei")
      done()
    });
    it("should get contents as csv", done => {
      that.setFromArray([["hello", "world"],["one", "two"]])
      var s = that.asCSV()
      expect(s).to.match(/hello\tworld\none\ttwo/)
      done()
    });
    
    it("should set CSV contents as array at position", done => {
      that.setFromArray([[1, 2, 3, 4],["a", "b", "c", "d"],["A", "B", "C", "D"]])
      that.setFromCSVat("hello\tworld\none\ttwo", 1,1)
      var a = that.asArray()
      expect(a[0][0]).to.equal("1")
      expect(a[1][1]).to.equal("hello")
      expect(a[2][1]).to.equal("one")
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
    
    it("should sellect two cells on SHIFT + left", done => {
      fillTableWithNumber(that)
      that.selectCell(that.cellAt(1,2))
      that.onLeftDown(new MockEvent(that, {shiftKey: true})) 
      expect(that.selectedCells.length).to.equal(2)
      done()
    });
   
   
    it("should sellect a four cells on SHIFT + left and SHIFT + down", done => {
      fillTableWithNumber(that)
      that.selectCell(that.cellAt(2,1))
      expect(that.currentColumnIndex, "currentColumnIndex").to.equal(2)
      expect(that.currentRowIndex, "currentRowIndex").to.equal(1)
      that.onLeftDown(new MockEvent(that, {shiftKey: true})) 
      expect(that.currentColumnIndex, "currentColumnIndex").to.equal(1)
      that.onDownDown(new MockEvent(that, {shiftKey: true})) 
      expect(that.currentRowIndex, "currentRowIndex").to.equal(2)

      expect(that.selectedCells.length).to.equal(4)
      done()
    });
    
    it("should desellect a four cells on SHIFT + left and SHIFT + down and SHIFT + up", done => {
      fillTableWithNumber(that)
      that.selectCell(that.cellAt(2,1))
      that.onLeftDown(new MockEvent(that, {shiftKey: true})) 
      that.onDownDown(new MockEvent(that, {shiftKey: true})) 
      that.onUpDown(new MockEvent(that, {shiftKey: true})) 
      expect(that.currentRowIndex, "currentRowIndex").to.equal(1)
      expect(that.selectedCells.length, "number of selected cells").to.equal(2)
      done()
    });
    it("should select a row", done => {
      fillTableWithNumber(that)
      that.selectRow(1)
      expect(that.selectedCells.length, "number of selected cells").to.equal(that.cells()[0].length)
      done()
    });
    it("should select a column", done => {
      fillTableWithNumber(that)
      that.selectColumn(1)
      expect(that.selectedCells.length, "number of selected cells").to.equal(that.cells().length)
      done()
    });

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
  
  describe("Position",  () => {
    it("should get right column and row of cell", done => {
      fillTableWithNumber(that)
      var cell = that.cellAt(2,1)
      expect(that.columnOfCell(cell), "columnOfCell").to.equal(2)
      expect(that.rowOfCell(cell), "rowOfCell").to.equal(1)
      done()
    });
  })
  
  describe("Navigation",  () => {
    it("should selection as CSV", done => {
      fillTableWithNumber(that)
      that.selectCell(that.cellAt(2,1))
      that.onLeftDown(new MockEvent(that, {shiftKey: true})) 
      that.onDownDown(new MockEvent(that, {shiftKey: true})) 
    
      expect(that.getSelectionAsCSV()).to.equal("2\t3\ntwo\tthree")
      done()
    });
  })


  describe("Add/Remove Column",  () => {
    it("should add column at an index", done => {
      fillTableWithNumber(that)
      var cells1 = that.cells()
      that.insertColumnAt(1)
      var cell1 = that.cellAt(1,0)
      var cells2 = that.cells()
      expect(cells1[0].length + 1).to.equal(cells2[0].length)
      done()
    });
    it("should remove column at an index", done => {
      fillTableWithNumber(that)
      var cells1 = that.cells()
      that.removeColumnAt(1)
      var cell1 = that.cellAt(1,0)
      var cells2 = that.cells()
      expect(cells1[0].length - 1).to.equal(cells2[0].length)
      done()
    });
    
  })

  describe("Access Columns",  () => {
    it("should get a column", done => {
      fillTableWithNumber(that)
      expect(that.column(1)[0], "column by index").to.equal(that.cells()[0][1])
      expect(that.column("B")[0], "column by label").to.equal(that.cells()[0][1])
      done()
    });

    it("should return undefined if label not in header", done => {
      fillTableWithNumber(that)
      expect(that.column("NotInHeader"), "column by label").to.equal(undefined)
      done()
    });

  })
  


  describe("Add/Remove Row",  () => {
    it("should add a row at an index", done => {
      fillTableWithNumber(that)
      var cells1 = that.cells()
      that.insertRowAt(1)
      var cell1 = that.cellAt(1,0)
      var cells2 = that.cells()
      expect(cells1.length + 1).to.equal(cells2.length)
      done()
    });
    it("should remove a row at an index", done => {
      fillTableWithNumber(that)
      var cells1 = that.cells()
      that.removeRowAt(1)
      var cell1 = that.cellAt(1,0)
      var cells2 = that.cells()
      expect(cells1.length - 1).to.equal(cells2.length)
      done()
    });



  })

  after("cleanup", () => {
    testWorld().innerHTML = "";
  });
});
