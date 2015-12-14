"use strict";
import * as scriptManager from './../src/client/script-manager.js';
import $ from 'https://code.jquery.com/jquery-2.1.4.js';

var expect = chai.expect;

describe('script-manager', function() {
    it('should add a script to an object', function(done) {
        let div = $("<div>");
        let divDomNode = div[0];
        let myFuncString = 'function myFunc() { return 5 }';

        scriptManager.addScript(div, myFuncString, {name: 'myFunc'});

        expect(typeof divDomNode.myFunc).to.be.equal('function');
        expect(divDomNode.myFunc.isScript).to.be.equal(true);
        expect(divDomNode.__scripts__['myFunc']).to.be.equal(myFuncString);
        expect(divDomNode.myFunc()).to.be.equal(5);
        done();
    });
});
