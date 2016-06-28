// adapted from convert-css-length
// MIT licensed, Copyright (c) 2015 Kyle Mathews
// https://github.com/KyleAMathews/convert-css-length/blob/master/LICENSE

function parseUnit(str, out) {
  if (!out) out = [ 0, '' ];
  str = String(str)
  var num = parseFloat(str, 10)
  out[0] = num
  out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || ''
  return out
}

var baseFontSize = "16px", parseUnit, unit, unitLess;

if (System.get("@system-env").browser) {
  try {
    var newBaseFontSize = cssLengthParser(16)(window.getComputedStyle(document.body).fontSize)
    if (newBaseFontSize && newBaseFontSize.slice(0,3) !== "NaN")
      baseFontSize = newBaseFontSize
  } catch (e) {}
}

function unit(length) { return parseUnit(length)[1]; }

function unitLess(length) { return parseUnit(length)[0]; }

export function genericCssLengthParser(baseFontSize) {
  if (baseFontSize == null) {
    baseFontSize = baseFontSize;
  }
  return function(length, toUnit, fromContext, toContext) {
    var fromUnit, outputLength, pxLength;
    if (fromContext == null) {
      fromContext = baseFontSize;
    }
    if (toContext == null) {
      toContext = fromContext;
    }
    fromUnit = unit(length);
    if (fromUnit === toUnit) {
      return length;
    }
    pxLength = unitLess(length);
    if (unit(fromContext) !== "px") {
      console.warn("Parameter fromContext must resolve to a value in pixel units.");
    }
    if (unit(toContext) !== "px") {
      console.warn("Parameter toContext must resolve to a value in pixel units.");
    }
    if (fromUnit !== "px") {
      if (fromUnit === "em") {
        pxLength = unitLess(length) * unitLess(fromContext);
      } else if (fromUnit === "rem") {
        pxLength = unitLess(length) * unitLess(baseFontSize);
      } else if (fromUnit === "ex") {
        pxLength = unitLess(length) * unitLess(fromContext) * 2;
      } else if (fromUnit === "ch" || fromUnit === "vw" || fromUnit === "vh" || fromUnit === "vmin") {
        console.warn(fromUnit + " units can't be reliably converted; Returning original value.");
        return length;
      } else {
        console.warn(fromUnit + " is an unknown or unsupported length unit; Returning original value.");
        return length;
      }
    }
    outputLength = pxLength;
    if (toUnit !== "px") {
      if (toUnit === "em") {
        outputLength = pxLength / unitLess(toContext);
      } else if (toUnit === "rem") {
        outputLength = pxLength / unitLess(baseFontSize);
      } else if (toUnit === "ex") {
        outputLength = pxLength / unitLess(toContext) / 2;
      } else if (toUnit === "ch" || toUnit === "vw" || toUnit === "vh" || toUnit === "vmin") {
        console.warn(toUnit + " units can't be reliably converted; Returning original value.");
        return length;
      } else {
        console.warn(toUnit + " is an unknown or unsupported length unit; Returning original value.");
        return length;
      }
    }
    return parseFloat(outputLength.toFixed(5)) + toUnit;
  };
}

export const parseCssLength = genericCssLengthParser(baseFontSize);

export function cssLengthToPixels(length) {
  return Number(parseCssLength(length, "px").slice(0,-2));
}
