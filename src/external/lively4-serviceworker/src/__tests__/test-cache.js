jest.autoMockOff();
jest.unmock('../cache.js');

const cache = require('../cache.js');
global.caches = {open: (cacheName) => ""};
function Response(a) {};
function Blob(a, b) {};
global.Response = Response;
global.Blob = Blob;


describe('Cache', () => {
  let cache_name = 'lively4';
  let age_cache_name = 'lively4-cache-line-ages';

  it('matches requests without timeout', async () => {
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

  // it('matches requests with valid timeout', async () => {
  //   let ret = {match: (request) => ""};
  //   let ret_age = {text: () => ""};
  //   let obj = new Object(null);

  //   spyOn(ret, 'match');
  //   spyOn(caches, 'open').and.returnValue(Promise.resolve(ret));
  //   spyOn(cache, 'purge');
  //   spyOn(cache, 'getAgeOf').and.returnValue(Promise.resolve(ret_age));
  //   spyOn(ret_age, 'text').and.returnValue(Promise.resolve("20"));
  //   spyOn(Date, 'now').and.returnValue(100);

  //   await cache.match(obj, 100);

  //   expect(ret_age.text).toHaveBeenCalled();
  //   expect(cache.purge).not.toHaveBeenCalled();
  //   expect(cache.getAgeOf).toHaveBeenCalled();
  //   expect(cache.getAgeOf).toHaveBeenCalledWith(obj);
  //   expect(caches.open).toHaveBeenCalled();
  //   expect(caches.open).toHaveBeenCalledWith(cache_name);
  //   expect(caches.open).toHaveBeenCalledWith(age_cache_name);
  //   expect(ret.match).toHaveBeenCalled();
  //   expect(ret.match).toHaveBeenCalledWith(obj);
  // });

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
    let time_obj = new Object(null);

    spyOn(ret, 'put');
    spyOn(Date, 'now').and.returnValue(time_obj);
    spyOn(caches, 'open').and.returnValue(Promise.resolve(ret));
    spyOn(global, 'Response').and.callThrough();
    spyOn(global, 'Blob').and.callThrough();

    await cache.put(obj, obj2);

    expect(global.Blob).toHaveBeenCalled();
    expect(global.Blob).toHaveBeenCalledWith([time_obj.toString()], {type : 'text/html'});
    expect(global.Response).toHaveBeenCalled();
    expect(global.Response).toHaveBeenCalledWith(new Blob());
    expect(caches.open).toHaveBeenCalled();
    expect(caches.open).toHaveBeenCalledWith(cache_name);
    expect(caches.open).toHaveBeenCalledWith(age_cache_name);
    expect(ret.put).toHaveBeenCalled();
    expect(ret.put).toHaveBeenCalledWith(obj, obj2);
    expect(ret.put).toHaveBeenCalledWith(obj, new Response());
  });

  it('gets ages of cached requests', async () => {
    let ret = {match: (request) => ""};
    let obj = new Object(null);

    spyOn(ret, 'match');
    spyOn(caches, 'open').and.returnValue(Promise.resolve(ret));

    await cache.getAgeOf(obj);

    expect(caches.open).toHaveBeenCalled();
    expect(caches.open).toHaveBeenCalledWith(age_cache_name);
    expect(ret.match).toHaveBeenCalled();
    expect(ret.match).toHaveBeenCalledWith(obj);
  });
});
