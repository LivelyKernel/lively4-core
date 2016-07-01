jest.autoMockOff();
jest.unmock('../cache.js');

const cache = require('../cache.js');
global.caches = {open: (cacheName) => ""};


describe('Cache', () => {
  let cache_name = 'lively4';

  it('matches requests', async () => {
    let ret = {match: (request) => ""};
    let obj = new Object(null);

    spyOn(ret, 'match');
    spyOn(caches, 'open').and.returnValue(Promise.resolve(ret));

    await cache.match(obj);

    expect(caches.open).toHaveBeenCalled();
    expect(caches.open).toHaveBeenCalledWith(cache_name);
    expect(ret.match).toHaveBeenCalled();
    expect(ret.match).toHaveBeenCalledWith(obj);
  });

  it('purges requests', async () => {
    let ret = {delete: (request, response) => ""};
    let obj = new Object(null);

    spyOn(ret, 'delete');
    spyOn(caches, 'open').and.returnValue(Promise.resolve(ret));

    await cache.purge(obj);

    expect(caches.open).toHaveBeenCalled();
    expect(caches.open).toHaveBeenCalledWith(cache_name);
    expect(ret.delete).toHaveBeenCalled();
    expect(ret.delete).toHaveBeenCalledWith(obj);
  });

  it('puts requests', async () => {
    let ret = {put: (request) => ""};
    let obj = new Object(null);
    let obj2 = new Object(null);

    spyOn(ret, 'put');
    spyOn(caches, 'open').and.returnValue(Promise.resolve(ret));

    await cache.put(obj, obj2);

    expect(caches.open).toHaveBeenCalled();
    expect(caches.open).toHaveBeenCalledWith(cache_name);
    expect(ret.put).toHaveBeenCalled();
    expect(ret.put).toHaveBeenCalledWith(obj, obj2);
  });
});
