
import { expect } from 'src/external/chai.js';
import { pt } from 'src/client/graphics.js';
import { ElementQuery, LocalStorageFileSystem as LSFS, LocalStorageFileSystemScheme } from "src/client/poid.js";

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

    describe('lsfs base', () => {

      const testKey = 'lsfstestkey';
      let lsfs;

      beforeEach("prepare test fs", function () {
        lsfs = new LSFS(testKey);
      });

      it('<internal> has test key', function () {
        expect(lsfs._key).to.equal(testKey);
      });

      describe('lsfs initialized', () => {

        const init = {
          sub: {
            'bar.js': 'lively.notify("bar");'
          },
          'foo.js': 'lively.notify("foo");'
        };

        beforeEach(function () {
          lsfs.create(init);
        });

        it('get file in root', function () {
          expect(lsfs.getFile('foo.js')).to.equal(init['foo.js']);
        });

        it('get file in sub folder', function () {
          expect(lsfs.getFile('sub/bar.js')).to.equal(init.sub['bar.js']);
        });

        it('put a file into root', function () {
          const expected = '' + Math.random();
          const newFile = 'new.js';
          lsfs.setFile(newFile, expected);
          expect(lsfs.getFile(newFile)).to.equal(expected);
        });

        it('put a file into sub folder', function () {
          const expected = '' + Math.random();
          const newFile = 'sub/new.js';
          lsfs.setFile(newFile, expected);
          expect(lsfs.getFile(newFile)).to.equal(expected);
        });

        it('put overwrites a file in sub folder', function () {
          const expected = '' + Math.random();
          const existingFile = 'sub/bar.js';
          lsfs.setFile(existingFile, expected);
          expect(lsfs.getFile(existingFile)).to.equal(expected);
        });

        it('check if a file exists', function () {
          expect(lsfs.existFile('foo.js')).to.be.true;
          expect(lsfs.existFile('sub/bar.js')).to.be.true;
          expect(lsfs.existFile('sub/blub.js')).to.be.false;
          // not a file
          expect(lsfs.existFile('sub/')).to.be.false;
        });
        
        it('remove a file in sub folder', function () {
          const fileToRemove = 'sub/bar.js';
          lsfs.deleteFile(fileToRemove);
          expect(lsfs.existFile(fileToRemove)).to.be.false;
        });

        it('check if a folder exists', function () {
          expect(lsfs.existFolder('')).to.be.true;
          expect(lsfs.existFolder('/')).to.be.true;
          expect(lsfs.existFolder('sub/')).to.be.true;
          expect(lsfs.existFolder('sub2/')).to.be.false;
          // not a folder
          expect(lsfs.existFolder('foo.js')).to.be.false;
          expect(lsfs.existFolder('sub/bar.js')).to.be.false;
        });
        
        it('create a folder (creating root throws)', function () {
          expect(() => lsfs.createFolder('')).to.throw('cannot create root');
          expect(() => lsfs.createFolder('/')).to.throw('cannot create root');
        });
        
        it('create a folder (creating root throws)', function () {
          lsfs.createFolder('sub2/');
          expect(lsfs.existFolder('sub2/')).to.be.true;
        });
        
        it('create a folder (nested)', function () {
          lsfs.createFolder('sub/sub2');
          expect(lsfs.existFolder('sub/sub2')).to.be.true;
        });
        
        it('create a folder (nested path throws)', function () {
          expect(() => lsfs.createFolder('a/non/existing/nested/path')).to.throw('a is no folder');
        });
        
        it('stat a file in root', function () {
          const stats = lsfs.statEntry('foo.js');
          expect(stats).to.have.property('name', 'foo.js');
          expect(stats).to.have.property('type', 'file');
        });

        it('stat a file in root', function () {
          const stats = lsfs.statEntry('sub/bar.js');
          expect(stats).to.have.property('name', 'bar.js');
          expect(stats).to.have.property('type', 'file');
        });

        it('stat root folder', function () {
          const stats = lsfs.statEntry('/');
          expect(stats).to.have.property('type', 'directory');
          expect(stats).to.have.property('contents');
          expect(stats.contents).to.have.length(2);
          expect(stats.contents).to.include({ name: 'foo.js', type: 'file' });
          expect(stats.contents).to.include({ name: 'sub', type: 'directory' });
        });

        it('stat a folder', function () {
          const stats = lsfs.statEntry('sub/');
          expect(stats).to.have.property('type', 'directory');
          expect(stats).to.have.property('contents');
          expect(stats.contents).to.have.length(1);
          expect(stats.contents).to.include({ name: 'bar.js', type: 'file' });
        });

        it('delete a folder', function () {
          lsfs.deleteFolder('sub/');
          expect(lsfs.existFolder('sub/')).to.be.false;
        });

      });

      it('has test key', function () {
        expect(lsfs._key).to.equal(testKey);
      });

      it('PUT a file into root', async function (done) {
        const expected = '' + Math.random();
        const newFile = 'lsfs://new.js';
        await lively.files.saveFile(newFile, expected);
        expect((await newFile.fetchText())).to.equal(expected);
        done();
      });
      it('PUT a file into sub folder', async function (done) {
        const expected = '' + Math.random();
        const newFile = 'lsfs://sub/new.js';
        await lively.files.saveFile(newFile, expected);
        expect((await newFile.fetchText())).to.equal(expected);
        done();
      });

      afterEach("cleanup", function () {});
    });

    describe('lsfs scheme', () => {
      let snapshot
      beforeEach('snapshot scheme\'s fs state', function () {
        snapshot = new LSFS(new LocalStorageFileSystemScheme().lsfsKey).root
      });

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
      it('PUT a file into sub folder', async function (done) {
        const expected = '' + Math.random();
        const newFile = 'lsfs://sub/new.js';
        await lively.files.saveFile(newFile, expected);
        expect((await newFile.fetchText())).to.equal(expected);
        done();
      });
      it('stat a file in root', async function (done) {
        const stats = await lively.files.stats('lsfs://foo.js');
        expect(stats).to.have.property('name', 'foo.js');
        expect(stats).to.have.property('type', 'file');
        done();
      });

      it('stat a file in root', async function (done) {
        const stats = await lively.files.stats('lsfs://sub/bar.js');
        expect(stats).to.have.property('name', 'bar.js');
        expect(stats).to.have.property('type', 'file');
        done();
      });

      it('stat root folder', async function (done) {
        const stats = await lively.files.stats('lsfs://');
        expect(stats).to.have.property('type', 'directory');
        expect(stats).to.have.property('contents');
        expect(stats.contents).to.include({ name: 'foo.js', type: 'file' });
        expect(stats.contents).to.include({ name: 'sub', type: 'directory' });
        done();
      });

      it('stat a folder', async function (done) {
        const stats = await lively.files.stats('lsfs://sub/');
        expect(stats).to.have.property('type', 'directory');
        expect(stats).to.have.property('contents');
        expect(stats.contents).to.include({ name: 'bar.js', type: 'file' });
        done();
      });
      
      it('stat a non-existing folder', async function (done) {
        const errorMsg = await lively.files.statFile('lsfs://non/existing/');
        expect(errorMsg).to.include('Error');
        done();
      });
      
      async function expectEmptyFolder(url) {
        const stats = await lively.files.stats(url);
        expect(stats).to.have.property('type', 'directory');
        expect(stats).to.have.property('contents');
        expect(stats.contents).to.have.length(0);
      }

      it('create a new folder in root', async function (done) {
        const folderPath = 'lsfs://new-folder/'
        await fetch(folderPath, {method: 'MKCOL'});
        await expectEmptyFolder(folderPath)
        done();
      });
      
      it('create a new folder in sub directory', async function (done) {
        const folderPath = 'lsfs://sub/new-folder/'
        await fetch(folderPath, {method: 'MKCOL'});
        await expectEmptyFolder(folderPath)
        done();
      });
      
      it('delete a folder', async function (done) {
        const folderPath = 'lsfs://sub/'
        await fetch(folderPath, {method: 'DELETE'});
        expect(await lively.files.exists(folderPath)).to.be.false
        done();
      });
      
      afterEach('apply snapshot as scheme\'s fs state', function () {
        new LSFS(new LocalStorageFileSystemScheme().lsfsKey).root = snapshot
      });
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