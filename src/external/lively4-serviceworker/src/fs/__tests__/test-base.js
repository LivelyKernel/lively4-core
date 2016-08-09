jest.autoMockOff();
jest.unmock('../base.js');

const base = require('../base.js');

jest.unmock('node-fetch');
const fetch = require('node-fetch');
global.Response = fetch.Response;

describe('Base', () => {

  it('constructs correctly', () => {
    let path = Object.create(null);
    let name = Object.create(null);
    let options = Object.create(null);

    expect(path).not.toBe(name);
    expect(path).not.toBe(options);
    expect(name).not.toBe(options);

    let bfs = new base.Base(name, path, options);
    expect(bfs).toBeDefined();
    expect(bfs.path).toBe(path);
    expect(bfs.name).toBe(name);
    expect(bfs.options).toBe(options);
  });

  it('does not stat paths', () => {
    let path = Object.create(null);
    let name = Object.create(null);
    let options = Object.create(null);
    let bfs = new base.Base(name, path, options);

    expect(() => {bfs.stat('')}).toThrow(new base.StatNotFoundError());
  });

  it('does not read paths', () => {
    let path = Object.create(null);
    let name = Object.create(null);
    let options = Object.create(null);
    let bfs = new base.Base(name, path, options);

    expect(() => {bfs.read('')}).toThrow(new base.FileNotFoundError());
  });

  it('does not write paths', () => {
    let path = Object.create(null);
    let name = Object.create(null);
    let options = Object.create(null);
    let bfs = new base.Base(name, path, options);

    let ret = Object.create(null);

    spyOn(Promise, 'resolve').and.returnValue(ret);

    let val = bfs.write('', '');

    expect(Promise.resolve).toHaveBeenCalledWith(new Response(null, {status: 405}));
    expect(val).toBe(ret);
  });
});

describe('Stat', () => {

  it('constructs correctly', () => {
    let isDirectory = Object.create(null);
    let contents = Object.create(null);
    let allowed = Object.create(null);

    expect(isDirectory).not.toBe(contents);
    expect(isDirectory).not.toBe(allowed);
    expect(contents).not.toBe(allowed);

    let stat = new base.Stat(isDirectory, contents, allowed);
    expect(stat).toBeDefined();
    expect(stat.isDirectory).toBe(isDirectory);
    expect(stat.contents).toBe(contents);
    expect(stat.allowed).toBe(allowed);
    expect(stat instanceof base.Stat).toBeTruthy();
  });

  it('returns itself as response', () => {
    let isDirectory = Object.create(null);
    let contents = Object.create(null);
    let allowed = Object.create(null);

    let stat = new base.Stat(isDirectory, contents, allowed);

    spyOn(stat, 'allowedToHeader').and.returnValue('GET');
    spyOn(stat, 'contentToJson').and.returnValue('{}');

    let ret = stat.toResponse();

    expect(ret).toEqual(new Response('{}', {status: 200, headers: {'Allow': 'GET'}}));
  });

  it('parses its allowed methods to a header string', () => {
    let isDirectory = Object.create(null);
    let contents = Object.create(null);
    let allowed = ['GET', 'OPTIONS'];

    let stat = new base.Stat(isDirectory, contents, allowed);

    let ret = stat.allowedToHeader();

    expect(ret).toEqual('GET,OPTIONS');
  });

  it('parses its contents to json', () => {
    let isDirectory = true;
    let contents = {some: 'dict', for: [{testing: 'reasons'}]};
    let allowed = Object.create(null);

    let stat = new base.Stat(isDirectory, contents, allowed);

    let ret = stat.contentToJson();

    expect(ret).toEqual(
`{
\t"type": "directory",
\t"contents": {
\t\t"some": "dict",
\t\t"for": [
\t\t\t{
\t\t\t\t"testing": "reasons"
\t\t\t}
\t\t]
\t}
}`);
  });
});

describe('File', () => {

  it('constructs correctly', () => {
    let blob = Object.create(null);

    let file = new base.File(blob);
    expect(file).toBeDefined();
    expect(file.blob).toBe(blob);
    expect(file instanceof base.File).toBeTruthy();
  });

  it('returns itself as response', () => {
    let blob = 'blob';

    let file = new base.File(blob);

    let ret = file.toResponse();

    expect(ret).toEqual(new Response(blob, {status: 200}));
  });
});

describe('StatNotFoundError', () => {

  it('constructs correctly', () => {
    let message = 'Some error message';

    let statError = new base.StatNotFoundError(message);

    expect(statError).toBeDefined();
    expect(statError.name).toBe('StatNotFoundError');
    expect(statError.message).toBe(message);
  });
});

describe('FileNotFoundError', () => {

  it('constructs correctly', () => {
    let message = 'Some error message';

    let fileError = new base.FileNotFoundError(message);

    expect(fileError).toBeDefined();
    expect(fileError.name).toBe('FileNotFoundError');
    expect(fileError.message).toBe(message);
  });
});

describe('IsDirectoryError', () => {

  it('constructs correctly', () => {
    let isDirError = new base.IsDirectoryError();

    expect(isDirError).toBeDefined();
    expect(isDirError.name).toBe('IsDirectoryError');
    expect(isDirError.message).toBe('The requested file is a directory.');
  });
});
