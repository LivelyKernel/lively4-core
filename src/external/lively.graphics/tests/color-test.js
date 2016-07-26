/*global describe, it*/

import { expect } from "mocha-es6";

import { Color } from "../color.js";

describe("lively.graphics", () => {

  it("parses a hex string", () => {
    expect(Color.rgbHex("#FFFFFF")).stringEquals(Color.white);
    expect(Color.rgbHex("#000000")).stringEquals(Color.black);
  });

});
