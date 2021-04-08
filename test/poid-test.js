
import { expect } from 'src/external/chai.js';
import { pt } from 'src/client/graphics.js';
import { ElementQuery } from "src/client/poid.js";

describe('Poid', () => {

  describe('ElementQuery', () => {

    before("load", async function (done) {
      this.elementa = <div id="elementa"><div id="elementb"></div></div>;
      document.body.appendChild(this.elementa);
      done();
    });

    describe('pathToElement', () => {
      it('should find global elment ', function () {
        expect(ElementQuery.pathToElement("query://#elementa")).to.equal(this.elementa);
      });
      it('should find subl elment ', function () {
        expect(ElementQuery.pathToElement("query://#elementa/#elementb")).to.equal(this.elementa.querySelector("#elementb"));
      });
    });

    after("cleanup", function () {
      this.elementa.remove();
    });
  });

  describe('LocalStorageFileSystem', () => {

    before("load", async function (done) {
      done();
    });

    describe('pathToElement', () => {
      it('fetch default element', async function (done) {
        expect((await 'lsfs://foo.js'.fetchText())).to.equal('lively.notify("foo");');
        done();
      });
      it('fetch default sub element', async function (done) {
        expect((await 'lsfs://sub/bar.js'.fetchText())).to.equal('lively.notify("bar");');
        done();
      });
      it('PUT a file into root', async function (done) {
        const expected = '' + Math.random();
        const newFile = 'lsfs://new.js';
        await lively.files.saveFile(newFile, expected);
        expect((await newFile.fetchText())).to.equal(expected);
        done();
      });
      xit('PUT a file into sub folder', async function (done) {
        const expected = '' + Math.random();
        const newFile = 'lsfs://sub/new.js';
        await lively.files.saveFile(newFile, expected);
        expect((await newFile.fetchText())).to.equal(expected);
        done();
      });
      it('should find subl elment ', function () {});
    });

    after("cleanup", function () {});
  });

  describe('Primitives', () => {

    describe('String', () => {

      const expected = 'hello world';
      const urlString = `string:${expected}`;

      it('returns a string as value', async function () {
        const value = await fetch(urlString).then(r => r.value());
        expect(value).to.equal(expected);
      });

      it('returns a string as text', async function () {
        const text = await fetch(urlString).then(r => r.text());
        expect(text).to.equal(expected);
      });

      it('returns a string as json', async function () {
        const json = await fetch(urlString).then(r => r.json());
        expect(json).to.equal(expected);
      });
    });

    describe('Number', () => {

      const expected = -2.34;
      const urlString = `number:${expected}`;

      it('returns a number as value', async function () {
        const value = await fetch(urlString).then(r => r.value());
        expect(value).to.equal(expected);
      });

      it('returns a number as text', async function () {
        const text = await fetch(urlString).then(r => r.text());
        expect(text).to.equal('' + expected);
      });

      it('returns a number as json', async function () {
        const json = await fetch(urlString).then(r => r.json());
        expect(json).to.equal(expected);
      });
    });

    describe('Date', () => {

      const expected = new Date(2018, 0, 1, 20, 15, 45);
      const urlString = `date:${expected.getTime()}`;

      it('returns a date as value', async function () {
        const value = await fetch(urlString).then(r => r.value());
        expect(value.getTime()).to.equal(expected.getTime());
      });

      it('returns a date as text', async function () {
        const text = await fetch(urlString).then(r => r.text());
        expect(text).to.equal('' + expected);
        expect(text.startsWith('Mon')).to.be.true;
      });

      it('returns a date as json', async function () {
        const json = await fetch(urlString).then(r => r.json());
        expect(json).to.equal(JSON.parse(JSON.stringify(expected)));
      });
    });

    describe('Bool', () => {

      const expectedTrue = true;
      const expectedFalse = false;
      const urlStringTrue = `bool:${expectedTrue}`;
      const urlStringFalse = `bool:${expectedFalse}`;

      it('returns a bool as value', async function () {
        const valueTrue = await fetch(urlStringTrue).then(r => r.value());
        expect(valueTrue).to.equal(expectedTrue);
        const valueFalse = await fetch(urlStringFalse).then(r => r.value());
        expect(valueFalse).to.equal(expectedFalse);
      });

      it('returns a bool as text', async function () {
        const textTrue = await fetch(urlStringTrue).then(r => r.text());
        expect(textTrue).to.equal('' + expectedTrue);
        const textFalse = await fetch(urlStringFalse).then(r => r.text());
        expect(textFalse).to.equal('' + expectedFalse);
      });

      it('returns a bool as json', async function () {
        const jsonTrue = await fetch(urlStringTrue).then(r => r.json());
        expect(jsonTrue).to.equal(expectedTrue);
        const jsonFalse = await fetch(urlStringFalse).then(r => r.json());
        expect(jsonFalse).to.equal(expectedFalse);
      });
    });
  });
});