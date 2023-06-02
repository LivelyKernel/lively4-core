
function isBlank(str) {
  return (/^\s*$/.test(str));
}

// `this` is a codemirror
export function hasCleanLeft(start) {
  const frontLineStart = {
    ch: 0,
    line: start.line
  };
  return isBlank(this.getRange(frontLineStart, start));
}

// `this` is a codemirror
export function hasCleanRight(pos) {
  const backLineEnd = {
    co: Infinity,
    line: pos.line
  };
  return isBlank(this.getRange(pos, backLineEnd));
}
