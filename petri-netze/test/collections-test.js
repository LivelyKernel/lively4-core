
import {expect} from 'src/external/chai.js';
import {pt} from 'src/client/graphics.js';

import {GroupMap} from "src/client/collections.js"

describe('Collections', () => {
  
  describe('GroupMap', () => {

    describe('construction', () => {
      
      it('create empty map of sets ', () => {
        var sut = new GroupMap()
        expect(sut._map.size).to.equal(0)
      })
      
      it('take object as intialization argument ', () => {
        var sut = new GroupMap({a: [1,2 ]})
        expect(sut._map.size).to.equal(1)
        expect(sut._map.get("a").size).to.equal(2)
      })
    })
    
    
    describe('add', () => {
       
      it('add key and value', () => {
        var sut = new GroupMap()
        sut.add("a", 4)
        sut.add("a", 5)
        expect(sut._map.size).to.equal(1)
        expect(sut._map.get("a").size).to.equal(2)
      })

      it('add key and value twich should make no differents', () => {
        var sut = new GroupMap()
        sut.add("a", 4)
        sut.add("a", 5)
        sut.add("a", 5)
        expect(sut._map.size).to.equal(1)
        expect(sut._map.get("a").size).to.equal(2)
      })

    })

    describe('remove', () => {
       
      it('remove value', () => {
        var sut = new GroupMap({a: [1], b: [3, 4]})

        sut.remove("b", 7)
        expect(sut._map.get("b").size).to.equal(2)
      })
    })
    
    describe('map', () => {
       
      it('maps keys', () => {
        var sut = new GroupMap({a: [1], b: [3, 4]})

        expect(sut.map((key, values) => key).join(";")).to.equal("a;b")
      })
       
      it('maps values', () => {
        var sut = new GroupMap({a: [1], b: [3, 4]})

        expect(sut.map((key, values) => values.size).join(";")).to.equal("1;2")
      })
    })
    
    
  })
});