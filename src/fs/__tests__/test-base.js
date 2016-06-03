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

    let ret = Object.create(null);

    spyOn(Promise, 'resolve').and.returnValue(ret);

    let val = bfs.stat('');

    expect(Promise.resolve).toHaveBeenCalledWith(new Response(null, {status: 405}));
    expect(val).toBe(ret);
  });

  it('does not read paths', () => {
    let path = Object.create(null);
    let name = Object.create(null);
    let options = Object.create(null);
    let bfs = new base.Base(name, path, options);

    let ret = Object.create(null);

    spyOn(Promise, 'resolve').and.returnValue(ret);

    let val = bfs.read('');

    expect(Promise.resolve).toHaveBeenCalledWith(new Response(null, {status: 405}));
    expect(val).toBe(ret);
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
