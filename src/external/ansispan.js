// Copyright MIT, frrom https://github.com/mmalecki/ansispan/blob/master/lib/ansispan.js

export default function ansispan(str) {
  Object.keys(ansispan.foregroundColors).forEach(function (ansi) {
    var span = '<span style="color: ' + ansispan.foregroundColors[ansi] + '">';

    //
    // `\033[Xm` == `\033[0;Xm` sets foreground color to `X`.
    //

    str = str.replace(
      new RegExp('\x1B\\[' + ansi + 'm', 'g'),
      span
    ).replace(
      new RegExp('\x1B\\[0;' + ansi + 'm', 'g'),
      span
    );
  });
  //
  // `\033[1m` enables bold font, `\033[22m` disables it
  //
  str = str.replace(/\x1B\[1m/g, '<b>').replace(/\x1B\[22m/g, '</b>');

  //
  // `\033[3m` enables italics font, `\033[23m` disables it
  //
  str = str.replace(/\x1B\[3m/g, '<i>').replace(/\x1B\[23m/g, '</i>');

  str = str.replace(/\x1B\[m/g, '</span>');
  str = str.replace(/\x1B\[0m/g, '</span>');
  return str.replace(/\x1B\[39m/g, '</span>');
};

ansispan.foregroundColors = {
  '30': 'black',
  '31': 'red',
  '32': 'green',
  '33': 'yellow',
  '34': 'blue',
  '35': 'purple',
  '36': 'cyan',
  '37': 'white'
};
