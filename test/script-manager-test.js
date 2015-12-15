"use strict";
import * as scriptManager from './../src/client/script-manager.js';
import $ from 'https://code.jquery.com/jquery-2.1.4.js';

var expect = chai.expect;

describe('Script mutations', function() {
    it('should add a script to an object, then update and remove it', function(done) {
        let div = $("<div>");
        let divDomNode = div[0];
        let myFuncString = 'function myFunc() { return 5 }';
        let myFuncStringUpdated = '() => 6';

        scriptManager.addScript(div, myFuncString, {name: 'myFunc'});

        expect(typeof divDomNode.myFunc).to.be.equal('function');
        expect(divDomNode.myFunc.isScript).to.be.equal(true);
        expect(divDomNode.__scripts__['myFunc']).to.be.equal(myFuncString);
        expect(divDomNode.myFunc()).to.be.equal(5);
        expect(div.children("script").size()).to.be.equal(1);

        scriptManager.updateScript(div, myFuncStringUpdated, {name: 'myFunc'});

        expect(typeof divDomNode.myFunc).to.be.equal('function');
        expect(divDomNode.__scripts__['myFunc']).to.be.equal(myFuncStringUpdated);
        expect(divDomNode.myFunc.isScript).to.be.equal(true);
        expect(divDomNode.myFunc()).to.be.equal(6);
        expect(div.children("script").size()).to.be.equal(1);

        scriptManager.removeScript(div, 'myFunc');

        expect(divDomNode.myFunc).to.be.equal(undefined);
        expect(divDomNode.__scripts__['myFunc']).to.be.equal(undefined);
        expect(div.children("script").size()).to.be.equal(0);

        done();
    });
});
