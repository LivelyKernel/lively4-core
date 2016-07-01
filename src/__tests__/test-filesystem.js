jest.autoMockOff();
jest.unmock('../filesystem.js');

jest.disableAutomock()

const filesystem = require('../filesystem.js');

jest.unmock('../fs/base.js');
const base = require('../fs/base.js');

jest.unmock('node-fetch');
const fetch = require('node-fetch');
global.Response = fetch.Response;

const focalStorage = require('../external/focalStorage.js').default;

describe('Filesystem', () => {

  it('constructs correctly', () => {
    let fs = new filesystem.Filesystem();
    expect(fs).toBeDefined();
    expect(fs.mounts instanceof Map).toBeTruthy();
    expect(fs.mounts.size).toBe(0);
    expect(fs.reqcount).toBe(0);
  });

  it('mounts basefs under path "base"', () => {
    jest.unmock('../fs/base.js');
    const basefs = require('../fs/base.js');
    let fs = new filesystem.Filesystem();
    fs.mount("base", basefs.Base, {testoption: 'aValue'});
    expect(fs.mounts.values().next().value instanceof basefs.Base).toBeTruthy();
    expect(fs.mounts.keys().next().value).toBe("base");
    expect(fs.mounts.size).toBe(1);
    expect(fs.reqcount).toBe(0);
  });

  it('unmounts basefs under path "base"', () => {
    jest.unmock('../fs/base.js');
    const basefs = require('../fs/base.js');
    let fs = new filesystem.Filesystem();
    fs.mount("base", basefs.Base, {testoption: 'aValue'});
    fs.umount("base");
    expect(fs.mounts.size).toBe(0);
    expect(fs.reqcount).toBe(0);
  });

});

describe('Filesystem with stubs', () => {
  let fs, stubfs, stubfs2 = null;

  beforeEach(function() {
    fs = new filesystem.Filesystem();

    stubfs = {
      read: function(value) {
        return "read";
      },
      write: function(value) {
        return "write";
      },
      stat: function(value) {
        return "stat";
      },
      options: {
        op3: "yes",
        op4: "no"
      },
      name: "first stub"
    };

    stubfs2 = {
      read: function(value) {
        return "read";
      },
      write: function(value) {
        return "write";
      },
      stat: function(value) {
        return "stat";
      },
      options: {
        op1: "yes",
        op2: "no"
      },
      name: "second stub"
    };

    fs.mounts.set("root", stubfs);
    fs.mounts.set("root/but/more", stubfs2);

    spyOn(stubfs, 'read');
    spyOn(stubfs, 'write');
    spyOn(stubfs, 'stat');
    spyOn(stubfs2, 'read');
    spyOn(stubfs2, 'write');
    spyOn(stubfs2, 'stat');
  });

  it('handels get requests', async () => {
    let req = {method: 'GET'}
    let url = {pathname: 'root/this/and/that.txt'}

    let file = new base.File('Some content.');

    stubfs.read.and.returnValue(Promise.resolve(file));

    let ret = await fs.handle(req, url);

    expect(ret).toEqual(file.toResponse());
    expect(stubfs.read).toHaveBeenCalled();
    expect(stubfs.read).toHaveBeenCalledWith('/this/and/that.txt', req);
  });

  it('handels get requests to direct response filesystems', async () => {
    let req = {method: 'GET'}
    let url = {pathname: 'root/this/and/that.txt'}
    let obj = Object.create(null);

    stubfs.read.and.returnValue(Promise.resolve(obj));

    let ret = await fs.handle(req, url);

    expect(ret).toBe(obj);
    expect(stubfs.read).toHaveBeenCalled();
    expect(stubfs.read).toHaveBeenCalledWith('/this/and/that.txt', req);
  });

  it('handels get requests with FileNotFoundError', async () => {
    let req = {method: 'GET'}
    let url = {pathname: 'root/this/and/that.txt'}

    stubfs.read.and.callFake((path) => {
      throw base.FileNotFoundError()
    });

    let ret = await fs.handle(req, url);

    expect(ret).toEqual(new Response(null, {status: 405}));
    expect(stubfs.read).toHaveBeenCalled();
    expect(stubfs.read).toHaveBeenCalledWith('/this/and/that.txt', req);
  });

  it('handels get requests with IsDirectoryError', async () => {
    let req = {method: 'GET'}
    let url = {pathname: 'root/this/and/that.txt'}

    stubfs.read.and.callFake((path) => {
      throw new base.IsDirectoryError()
    });

    let ret = await fs.handle(req, url);

    expect(ret).toEqual(new Response(null, {
            status: 405,
            statusText: 'EISDIR',
            headers: {'Allow': 'OPTIONS'}
          }));
    expect(stubfs.read).toHaveBeenCalled();
    expect(stubfs.read).toHaveBeenCalledWith('/this/and/that.txt', req);
  });

  it('handels put requests', () => {
    let text = Object.create(null)
    let req = {method: 'PUT', text: () => text}
    let url = {pathname: 'root/this/and/that.txt'}
    fs.handle(req, url)

    expect(stubfs.write).toHaveBeenCalled();
    expect(stubfs.write).toHaveBeenCalledWith('/this/and/that.txt', text, req);
  });

  it('handels options requests', async () => {
    let req = {method: 'OPTIONS'}
    let url = {pathname: 'root/this/and/that.txt'}

    let stat = new base.Stat(false, {val: 'Some content.'}, 'GET,OPTIONS');

    stubfs.stat.and.returnValue(Promise.resolve(stat));

    let ret = await fs.handle(req, url);

    expect(ret).toEqual(stat.toResponse());
    expect(stubfs.stat).toHaveBeenCalled();
    expect(stubfs.stat).toHaveBeenCalledWith('/this/and/that.txt', req);
  });

  it('handels options requests to direct response filesystems', async () => {
    let req = {method: 'OPTIONS'};
    let url = {pathname: 'root/this/and/that.txt'};
    let obj = Object.create(null);

    stubfs.stat.and.returnValue(Promise.resolve(obj));

    let ret = await fs.handle(req, url);

    expect(ret).toBe(obj);
    expect(stubfs.stat).toHaveBeenCalled();
    expect(stubfs.stat).toHaveBeenCalledWith('/this/and/that.txt', req);
  });

  it('handels options requests with StatNotFoundError', async () => {
    let req = {method: 'OPTIONS'}
    let url = {pathname: 'root/this/and/that.txt'}

    stubfs.stat.and.callFake((path) => {
      throw base.StatNotFoundError()
    });

    let ret = await fs.handle(req, url);

    expect(ret).toEqual(new Response(null, {status: 405}));
    expect(stubfs.stat).toHaveBeenCalled();
    expect(stubfs.stat).toHaveBeenCalledWith('/this/and/that.txt', req);
  });

  it('handels requests with object of longest match', () => {
    let req = {method: 'GET'}
    let url = {pathname: 'root/but/more/this/and/that.txt'}
    fs.handle(req, url)

    expect(stubfs2.read).toHaveBeenCalled();
    expect(stubfs.read).not.toHaveBeenCalled();
  });

  it('handels request count', () => {
    let req = {method: 'GET'}
    let url = {pathname: 'root/but/more/this/and/that.txt'}

    expect(fs.reqcount).toBe(0);
    fs.handle(req, url)
    expect(fs.reqcount).toBe(1);
    fs.handle(req, url)
    expect(fs.reqcount).toBe(2);
    fs.handle(req, url)
    expect(fs.reqcount).toBe(3);
    fs.handle(req, url)
    expect(fs.reqcount).toBe(4);
  });

  it('handels invalid path', async () => {
    let req = {method: 'GET'}
    let url = {pathname: 'boot/but/more/this/and/that.txt'}

    expect(await fs.handle(req, url)).toEqual(new Response(null, {status: 400}));
  });

  it('handels unsupported method', async () => {
    let req = {method: 'DELETE'}
    let url = {pathname: 'root/but/more/this/and/that.txt'}

    expect(await fs.handle(req, url)).toEqual(new Response(null, {status: 400}));
  });

  it('returns mounts as jso', () => {
    let res = [{
      name: 'first stub',
      options: {
       op3: 'yes',
       op4: 'no'
      },
      path: 'root'
    },{
      name: 'second stub',
      options: {
       op1: 'yes',
       op2: 'no'
      },
      path: 'root/but/more'
    }];
    expect(fs.mountsAsJso()).toEqual(res);
  });

  it('persists mounts', () => {
    let res = [{
      name: 'first stub',
      options: {
       op3: 'yes',
       op4: 'no'
      },
      path: 'root'
    },{
      name: 'second stub',
      options: {
       op1: 'yes',
       op2: 'no'
      },
      path: 'root/but/more'
    }];
    spyOn(focalStorage, 'setItem');

    fs.persistMounts();

    expect(focalStorage.setItem).toHaveBeenCalled();
    expect(focalStorage.setItem).toHaveBeenCalledWith("lively4mounts", res);
  });

  it('loads persisted mounts', async () => {
    let res = [{
      name: 'fake',
      options: {
       op3: 'yes',
       op4: 'no'
      },
      path: 'additional1'
    },{
      name: 'fake2',
      options: {
       op1: 'yes',
       op2: 'no'
      },
      path: 'additional2'
    }];
    spyOn(focalStorage, 'getItem').and.returnValue(Promise.resolve(res));
    let obj = Object.create(null);
    let whatever = {default: obj};

    global.System = {import: () => Promise.resolve(whatever)};
    spyOn(System, 'import').and.returnValue(Promise.resolve({default: obj}));
    spyOn(fs, 'mount');

    await fs.loadMounts();

    expect(focalStorage.getItem).toHaveBeenCalledWith("lively4mounts");
    expect(System.import).toHaveBeenCalledWith("src/swx/fs/fake.js");
    expect(System.import).toHaveBeenCalledWith("src/swx/fs/fake2.js");
    expect(fs.mount).toHaveBeenCalledWith("additional1", obj, {op3: 'yes', op4: 'no'});
    expect(fs.mount).toHaveBeenCalledWith("additional2", obj, {op1: 'yes', op2: 'no'});
    expect(fs.mount.calls.mostRecent().args[0]).toEqual("additional2");
  });

  it('loads persisted mounts', async () => {
    let res = [{
      name: 'fake',
      options: {
       op3: 'yes',
       op4: 'no'
      },
      path: 'additional1'
    }];
    spyOn(focalStorage, 'getItem').and.returnValue(Promise.resolve(res));

    global.System = {import: () => ""};
    global.console = {error: () => ""};
    let obj = Object.create(null);
    let prom = null;
    prom = Promise.reject(new Error("Test Error Message"));

    spyOn(System, 'import').and.returnValue(prom);
    spyOn(console, 'error');

    try {
      await fs.loadMounts();
    } catch (e) {
      expect(e.error).toEqual("Test Error Message");
    }

    expect(console.error).toHaveBeenCalledWith(new Error("Test Error Message"));
  });
});
