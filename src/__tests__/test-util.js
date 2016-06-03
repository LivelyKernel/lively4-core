jest.unmock('../util.js');

const util = require('../util.js');

describe('util', () => {
  it('converts the response to json', () => {
    let response = {json: () => "myPrettyReturnValue"};
    let response2 = {json: () => "myPrettyReturnValue2"};

    spyOn(response, 'json').and.callThrough();
    spyOn(response2, 'json').and.callThrough();

    expect(util.responseToJson(response)).toBe("myPrettyReturnValue");
    expect(util.responseToJson(response2)).toBe("myPrettyReturnValue2");

    expect(response.json).toHaveBeenCalled();
    expect(response2.json).toHaveBeenCalled();
  });

  it('returns the response if its status is OK', () => {
    let response = {status: 200};
    let response2 = {status: 299};

    expect(util.responseOk(response)).toBe(response);
    expect(util.responseOk(response2)).toBe(response2);
  });

  it('throws an error if response status is not OK', () => {
    let response = {status: 199, statusText: "res1"};
    let response2 = {status: 300, statusText: "res2"};

    expect(() => util.responseOk(response)).toThrowError("res1");
    expect(() => util.responseOk(response2)).toThrowError("res2");
  });

  it('generates a UUID', () => {
    global.crypto = {getRandomValues: () => ""};
    spyOn(crypto, 'getRandomValues').and.returnValue([12]);

    let ret = util.generateUUID();

    expect(crypto.getRandomValues).toHaveBeenCalledWith(new Uint8Array(1));
    expect(ret).toEqual("cccccccc-cccc-4ccc-8ccc-cccccccccccc");
  });
});