/*global*/

// String utility methods for printing, parsing, and converting strings.
;(function(exports) {

// show-in-doc
var string = exports.string = {

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // printing and formatting strings
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  format: function strings$format() {
    // String+ -> String
    // Takes a variable number of arguments. The first argument is the format
    // string. Placeholders in the format string are marked with `"%s"`.
    // Example:
    //   jsext.string.format("Hello %s!", "Lively User"); // => "Hello Lively User!"
    return string.formatFromArray(Array.prototype.slice.call(arguments));
  },

  formatFromArray: function strings$formatFromArray(objects) {
    var self = objects.shift();
    if (!self) { console.log("Error in Strings>>formatFromArray, first arg is undefined"); };

    function appendText(object, string) { return "" + object; }

    function appendInteger(value, string) { return value.toString(); }

    function appendFloat(value, string, precision) {
      if (precision > -1) return value.toFixed(precision);
      else return value.toString();
    }

    function appendObject(value, string) { return Objects.inspect(value); }

    var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat, o: appendObject};
    var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;

    function parseFormat(fmt) {
      var oldFmt = fmt;
      var parts = [];

      for (var m = reg.exec(fmt); m; m = reg.exec(fmt)) {
        var type = m[8] || m[5],
          appender = type in appenderMap ? appenderMap[type] : appendObject,
          precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);
        parts.push(fmt.substr(0, m[0][0] == "%" ? m.index : m.index + 1));
        parts.push({appender: appender, precision: precision});

        fmt = fmt.substr(m.index + m[0].length);
      }
      if (fmt)
        parts.push(fmt.toString());

      return parts;
    };

    var parts = parseFormat(self),
      str = "",
      objIndex = 0;

    for (var i = 0; i < parts.length; ++i) {
      var part = parts[i];
      if (part && typeof(part) == "object") {
        var object = objects[objIndex++];
        str += (part.appender || appendText)(object, str, part.precision);
      } else {
        str += appendText(part, str);
      }
    }
    return str;
  },

  indent: function (str, indentString, depth) {
    // String -> String -> String? -> String
    // Example: 
    //   string.indent("Hello", "  ", 2) // => "    Hello"
    if (!depth || depth <= 0) return str;
    while (depth > 0) { depth--; str = indentString + str; }
    return str;
  },

  removeSurroundingWhitespaces: function(str) {
    // Example:
    //   string.removeSurroundingWhitespaces("  hello\n  world  ") // => "hello\nworld"
    function removeTrailingWhitespace(s) {
      while (s.length > 0 && /\s|\n|\r/.test(s[s.length - 1]))
        s = s.substring(0, s.length - 1);
      return s;
    }
    function removeLeadingWhitespace(string) {
      return string.replace(/^[\n\s]*(.*)/, '$1');
    }
    return removeLeadingWhitespace(removeTrailingWhitespace(str));
  },

  quote: function(str) {
    // Example:
    //   string.print("fo\"o") // => "\"fo\\\"o\""
    return '"' + str.replace(/"/g, '\\"') + '"';
  },

  print: function print(obj) {
    // Prints Arrays and escapes quotations. See `obj.inspect` for how to
    // completely print / inspect JavaScript data strcutures
    // Example:
    //   string.print([[1,2,3], "string", {foo: 23}])
    //      // => [[1,2,3],"string",[object Object]]
    if (obj && Array.isArray(obj)) return '[' + obj.map(print) + ']';
    if (typeof obj !== "string") return String(obj);
    var result = String(obj);
    result = result.replace(/\n/g, '\\n\\\n');
    result = result.replace(/(")/g, '\\$1');
    result = '\"' + result + '\"';
    return result;
  },

  printNested: function(list, depth) {
    // Example:
    //   string.printNested([1,2,[3,4,5]]) // => "1\n2\n  3\n  4\n  5\n"
    depth = depth || 0;
    var s = ""
    list.forEach(function(ea) {
      if (ea instanceof Array) {
        s += string.printNested(ea, depth + 1)
      } else {
        s +=  string.indent(ea +"\n", '  ', depth);
      }
    })
    return s
  },

  pad: function(string, n, left) {
    // Examples:
    // string.pad("Foo", 2) // => "Foo  "
    // string.pad("Foo", 2, true) // => "  Foo"
    return left ? ' '.times(n) + string : string + ' '.times(n);
  },

  printTable: function(tableArray, options) {
    // Array -> Object? -> String
    // Takes a 2D Array and prints a table string. Kind of the reverse
    // operation to `strings.tableize`
    // Example:
    //   string.printTable([["aaa", "b", "c"], ["d", "e","f"]])
    //    // =>
    //    // aaa b c
    //    // d   e f
    var columnWidths = [],
      separator = (options && options.separator) || ' ',
      alignLeftAll = !options || !options.align || options.align === 'left',
      alignRightAll = options && options.align === 'right';
    function alignRight(columnIndex) {
      if (alignLeftAll) return false;
      if (alignRightAll) return true;
      return options
        && Object.isArray(options.align)
        && options.align[columnIndex] === 'right';
    }
    tableArray.forEach(function(row) {
      row.forEach(function(cellVal, i) {
        if (columnWidths[i] === undefined) columnWidths[i] = 0;
        columnWidths[i] = Math.max(columnWidths[i], String(cellVal).length);
      });
    });
    return tableArray.collect(function(row) {
      return row.collect(function(cellVal, i) {
        var cellString = String(cellVal);
        return string.pad(cellString,
                   columnWidths[i] - cellString.length,
                   alignRight(i));
      }).join(separator);
    }).join('\n');
  },

  printTree: function(rootNode, nodePrinter, childGetter, indent) {
    // Object -> Function -> Function -> Number? -> String
    // A generic function to print a tree representation from a nested data structure.
    // Receives three arguments:
    // - `rootNode` an object representing the root node of the tree
    // - `nodePrinter` is a function that gets a tree node and should return stringified version of it
    // - `childGetter` is a function that gets a tree node and should return a list of child nodes
    // Example:
    // var root = {name: "a", subs: [{name: "b", subs: [{name: "c"}]}, {name: "d"}]};
    // string.printTree(root, function(n) { return n.name; }, function(n) { return n.subs; });
    // // =>
    // // a
    // // |-b
    // // | \-c
    // // \-d

    var nodeList = [];
    indent = indent || '  ';
    iterator(0, 0, rootNode);
    return nodeList.join('\n');
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function iterator(depth, index, node) {
      // 1. Create stringified representation of node
      nodeList[index] = (string.times(indent, depth)) + nodePrinter(node, depth);
      var children = childGetter(node, depth),
        childIndex = index + 1;
      if (!children || !children.length) return childIndex;
      // 2. If there are children then assemble those linear inside nodeList
      // The childIndex is the pointer of the current items of childList into
      // nodeList.
      var lastIndex = childIndex,
        lastI = children.length - 1;
      children.forEach(function(ea, i) {
        childIndex = iterator(depth+1, childIndex, ea);
        // 3. When we have printed the recursive version then augment the
        // printed version of the direct children with horizontal slashes
        // directly in front of the represented representation
        var isLast = lastI === i,
          cs = nodeList[lastIndex].split(''),
          fromSlash = (depth*indent.length)+1,
          toSlash = (depth*indent.length)+indent.length;
        for (var i = fromSlash; i < toSlash; i++) cs[i] = '-';
        if (isLast) cs[depth*indent.length] = '\\';
        nodeList[lastIndex] = cs.join('');
        // 4. For all children (direct and indirect) except for the
        // last one (itself and all its children) add vertical bars in
        // front of each at position of the current nodes depth. This
        // makes is much easier to see which child node belongs to which
        // parent
        if (!isLast)
          nodeList.slice(lastIndex, childIndex).forEach(function(ea, i) {
            var cs2 = ea.split('');
            cs2[depth*indent.length] = '|';
            nodeList[lastIndex+i] = cs2.join(''); });
        lastIndex = childIndex;
      });
      return childIndex;
    }
  },

  toArray: function(s) {
    // Example:
    // string.toArray("fooo") // => ["f","o","o","o"]
    return s.split('');
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // parsing strings into other entities
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  lines: function(str) {
    // Example: string.lines("foo\nbar\n\rbaz") // => ["foo","bar","baz"]
    return str.split(/\n\r?/);
  },

  paragraphs: function(string, options) {
    // Examples:
    // var text = "Hello, this is a pretty long sentence\nthat even includes new lines."
    //         + "\n\n\nThis is a sentence in  a new paragraph.";
    // string.paragraphs(text) // => [
    //   // "Hello, this is a pretty long sentence\nthat even includes new lines.",
    //   // "This is a sentence in  a new paragraph."]
    // string.paragraphs(text, {keepEmptyLines: true}) // => [
    //   // "Hello, this is a pretty long sentence\n that even includes new lines.",
    //   // "\n ",
    //   // "This is a sentence in  a new paragraph."]
    var sep = options ? options.sep : '\n\n';
    if (!options || !options.keepEmptyLines) return string.split(new RegExp(sep + '+'));
    function isWhiteSpace(s) { return (/^\s*$/).test(s); }
    return string.split('\n').concat('').reduce(function(parasAndLast, line) {
      var paras = parasAndLast[0], last = parasAndLast[1];
      if (isWhiteSpace(last) === isWhiteSpace(line)) {
        last += '\n' + line;
      } else {
         last.length && paras.push(last); last = line;
      }
      return [paras, last];
    }, [[], ''])[0];
  },

  nonEmptyLines: function(str) {
    // Example: string.nonEmptyLines("foo\n\nbar\n") // => ["foo","bar"]
    return string.lines(str).compact();
  },

  tokens: function(str, regex) {
    // Example:
    // string.tokens(' a b c') => ['a', 'b', 'c']
    return str.split(regex || /\s+/).filter(function(tok) {
      return !(/^\s*$/).test(tok); });
  },

  tableize: function(s, options) {
    // String -> Object? -> Array
    // Takes a String representing a "table" and parses it into a 2D-Array (as
    // accepted by the `collection.Grid` methods or `string.printTable`)
    // ```js
    // options = {
    //     convertTypes: BOOLEAN, // automatically convert to Numbers, Dates, ...?
    //     cellSplitter: REGEXP // how to recognize "cells", by default just spaces
    // }
    // ```
    // Examples:
    // string.tableize('a b c\nd e f')
    // // => [["a","b","c"],["d","e","f"]]
    // // can also parse csv like
    // var csv = '"Symbol","Name","LastSale",\n'
    //         + '"FLWS","1-800 FLOWERS.COM, Inc.","5.65",\n'
    //         + '"FCTY","1st Century Bancshares, Inc","5.65",'
    // string.tableize(csv, {cellSplitter: /^\s*"|","|",?\s*$/g})
    // // => [["Symbol","Name","LastSale"],
    // //     ["FLWS","1-800 FLOWERS.COM, Inc.",5.65],
    // //     ["FCTY","1st Century Bancshares, Inc",5.65]]

    options = options || {};
    var splitter = options.cellSplitter || /\s+/,
        emptyStringRe = /^\s*$/,
        convertTypes = options.hasOwnProperty('convertTypes') ? !!options.convertTypes : true,
        lines = string.lines(s), table = [];
    for (var i = 0; i < lines.length; i++) {
      var tokens = string.tokens(lines[i], splitter);
      if (convertTypes) {
        tokens = tokens.map(function(tok) {
          if (tok.match(emptyStringRe)) return tok;
          var num = Number(tok);
          if (!isNaN(num)) return num;
          var date = new Date(tok);
          if (!isNaN(+date)) return date;
          return tok.trim();
        });
      }
      if (tokens.length > 0) table.push(tokens);
    }
    return table;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // (un)escape / encoding / decoding
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  unescapeCharacterEntities: function(s) {
    // Converts [character entities](http://dev.w3.org/html5/html-author/charref)
    // into utf-8 strings
    // Example:
    //   string.unescapeCharacterEntities("foo &amp;&amp; bar") // => "foo && bar"
    if (typeof document === 'undefined') throw new Error("Cannot unescapeCharacterEntities");
    var div = document.createElement('div');
    div.innerHTML = s;
    return div.textContent;
  },

  toQueryParams: function(s, separator) {
    // Example:
    // string.toQueryParams("http://example.com?foo=23&bar=test")
    //   // => {bar: "test", foo: "23"}
    var match = s.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return {};

    var hash = match[1].split(separator || '&').inject({}, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift());
        var value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Array.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        } else hash[key] = value;
      }
      return hash;
    });
    return hash;
  },

  // -=-=-=-=-=-=-=-=-
  // ids and hashing
  // -=-=-=-=-=-=-=-=-

  newUUID: function() {
    // Example:
    //   string.newUUID() // => "3B3E74D0-85EA-45F2-901C-23ECF3EAB9FB"
    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    }).toUpperCase();
    return id;
  },

  createDataURI: function(content, mimeType) {
    // String -> String -> String
    // Takes some string representing content and a mime type.
    // For a list of mime types see: [http://www.iana.org/assignments/media-types/media-types.xhtml]()
    // More about data URIs: [https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs]()
    // Example:
    //   window.open(string.createDataURI('<h1>test</h1>', 'text/html'));
    mimeType = mimeType || "text/plain";
    return "data:" + mimeType
       + ";base64," + btoa(content);
  },

  hashCode: function(s) {
    // [http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/]()
    // Example: string.hashCode("foo") // => 101574
    var hash = 0, len = s.length;
    if (len == 0) return hash;
    for (var i = 0; i < len; i++) {
      var c = s.charCodeAt(i);
      hash = ((hash<<5)-hash) + c;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  },

  md5: function (string) {
    // © Joseph Myers [http://www.myersdaily.org/joseph/javascript/md5-text.html]()
    // Example:
    //   string.md5("foo") // => "acbd18db4cc2f85cedef654fccc4a4d8"

  	function cmn(q, a, b, x, s, t) {
			a = add32(add32(a, q), add32(x, t));
			return add32((a << s) | (a >>> (32 - s)), b);
		}

		function ff(a, b, c, d, x, s, t) {
			return cmn((b & c) | ((~b) & d), a, b, x, s, t);
		}

		function gg(a, b, c, d, x, s, t) {
			return cmn((b & d) | (c & (~d)), a, b, x, s, t);
		}

		function hh(a, b, c, d, x, s, t) {
			return cmn(b ^ c ^ d, a, b, x, s, t);
		}

		function ii(a, b, c, d, x, s, t) {
			return cmn(c ^ (b | (~d)), a, b, x, s, t);
		}

		/* ignore-in-doc
		this function is much faster,
		so if possible we use it. Some IEs
		are the only ones I know of that
		need the idiotic second function,
		generated by an if clause.  */
    var add32 = hex(md51("hello")) === "5d41402abc4b2a76b9719d911017c592" ?
      function add32(a, b) { return (a + b) & 0xFFFFFFFF; } :
  		function add32(x, y) {
  			var lsw = (x & 0xFFFF) + (y & 0xFFFF),
  			msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  			return (msw << 16) | (lsw & 0xFFFF);
  		}

		function md5cycle(x, k) {
			var a = x[0], b = x[1], c = x[2], d = x[3];

			a = ff(a, b, c, d, k[0], 7, -680876936);
			d = ff(d, a, b, c, k[1], 12, -389564586);
			c = ff(c, d, a, b, k[2], 17,  606105819);
			b = ff(b, c, d, a, k[3], 22, -1044525330);
			a = ff(a, b, c, d, k[4], 7, -176418897);
			d = ff(d, a, b, c, k[5], 12,  1200080426);
			c = ff(c, d, a, b, k[6], 17, -1473231341);
			b = ff(b, c, d, a, k[7], 22, -45705983);
			a = ff(a, b, c, d, k[8], 7,  1770035416);
			d = ff(d, a, b, c, k[9], 12, -1958414417);
			c = ff(c, d, a, b, k[10], 17, -42063);
			b = ff(b, c, d, a, k[11], 22, -1990404162);
			a = ff(a, b, c, d, k[12], 7,  1804603682);
			d = ff(d, a, b, c, k[13], 12, -40341101);
			c = ff(c, d, a, b, k[14], 17, -1502002290);
			b = ff(b, c, d, a, k[15], 22,  1236535329);

			a = gg(a, b, c, d, k[1], 5, -165796510);
			d = gg(d, a, b, c, k[6], 9, -1069501632);
			c = gg(c, d, a, b, k[11], 14,  643717713);
			b = gg(b, c, d, a, k[0], 20, -373897302);
			a = gg(a, b, c, d, k[5], 5, -701558691);
			d = gg(d, a, b, c, k[10], 9,  38016083);
			c = gg(c, d, a, b, k[15], 14, -660478335);
			b = gg(b, c, d, a, k[4], 20, -405537848);
			a = gg(a, b, c, d, k[9], 5,  568446438);
			d = gg(d, a, b, c, k[14], 9, -1019803690);
			c = gg(c, d, a, b, k[3], 14, -187363961);
			b = gg(b, c, d, a, k[8], 20,  1163531501);
			a = gg(a, b, c, d, k[13], 5, -1444681467);
			d = gg(d, a, b, c, k[2], 9, -51403784);
			c = gg(c, d, a, b, k[7], 14,  1735328473);
			b = gg(b, c, d, a, k[12], 20, -1926607734);

			a = hh(a, b, c, d, k[5], 4, -378558);
			d = hh(d, a, b, c, k[8], 11, -2022574463);
			c = hh(c, d, a, b, k[11], 16,  1839030562);
			b = hh(b, c, d, a, k[14], 23, -35309556);
			a = hh(a, b, c, d, k[1], 4, -1530992060);
			d = hh(d, a, b, c, k[4], 11,  1272893353);
			c = hh(c, d, a, b, k[7], 16, -155497632);
			b = hh(b, c, d, a, k[10], 23, -1094730640);
			a = hh(a, b, c, d, k[13], 4,  681279174);
			d = hh(d, a, b, c, k[0], 11, -358537222);
			c = hh(c, d, a, b, k[3], 16, -722521979);
			b = hh(b, c, d, a, k[6], 23,  76029189);
			a = hh(a, b, c, d, k[9], 4, -640364487);
			d = hh(d, a, b, c, k[12], 11, -421815835);
			c = hh(c, d, a, b, k[15], 16,  530742520);
			b = hh(b, c, d, a, k[2], 23, -995338651);

			a = ii(a, b, c, d, k[0], 6, -198630844);
			d = ii(d, a, b, c, k[7], 10,  1126891415);
			c = ii(c, d, a, b, k[14], 15, -1416354905);
			b = ii(b, c, d, a, k[5], 21, -57434055);
			a = ii(a, b, c, d, k[12], 6,  1700485571);
			d = ii(d, a, b, c, k[3], 10, -1894986606);
			c = ii(c, d, a, b, k[10], 15, -1051523);
			b = ii(b, c, d, a, k[1], 21, -2054922799);
			a = ii(a, b, c, d, k[8], 6,  1873313359);
			d = ii(d, a, b, c, k[15], 10, -30611744);
			c = ii(c, d, a, b, k[6], 15, -1560198380);
			b = ii(b, c, d, a, k[13], 21,  1309151649);
			a = ii(a, b, c, d, k[4], 6, -145523070);
			d = ii(d, a, b, c, k[11], 10, -1120210379);
			c = ii(c, d, a, b, k[2], 15,  718787259);
			b = ii(b, c, d, a, k[9], 21, -343485551);

			x[0] = add32(a, x[0]);
			x[1] = add32(b, x[1]);
			x[2] = add32(c, x[2]);
			x[3] = add32(d, x[3]);

		}

		function md51(s) {
			var n = s.length,
			state = [1732584193, -271733879, -1732584194, 271733878], i;
			for (i=64; i<=n; i+=64) {
				md5cycle(state, md5blk(s.substring(i-64, i)));
			}
			s = s.substring(i-64);
			var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], sl=s.length;
			for (i=0; i<sl; i++) 	tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
			tail[i>>2] |= 0x80 << ((i%4) << 3);
			if (i > 55) {
				md5cycle(state, tail);
				i=16;
				while (i--) { tail[i] = 0 }
	//			for (i=0; i<16; i++) tail[i] = 0;
			}
			tail[14] = n*8;
			md5cycle(state, tail);
			return state;
		}

		/* ignore-in-doc
		 * there needs to be support for Unicode here,
		 * unless we pretend that we can redefine the MD-5
		 * algorithm for multi-byte characters (perhaps
		 * by adding every four 16-bit characters and
		 * shortening the sum to 32 bits). Otherwise
		 * I suggest performing MD-5 as if every character
		 * was two bytes--e.g., 0040 0025 = @%--but then
		 * how will an ordinary MD-5 sum be matched?
		 * There is no way to standardize text to something
		 * like UTF-8 before transformation; speed cost is
		 * utterly prohibitive. The JavaScript standard
		 * itself needs to look at this: it should start
		 * providing access to strings as preformed UTF-8
		 * 8-bit unsigned value arrays.
		 */
		function md5blk(s) { 		/* I figured global was faster.   */
			var md5blks = [], i; 	/* Andy King said do it this way. */
			for (i=0; i<64; i+=4) {
			md5blks[i>>2] = s.charCodeAt(i)
			+ (s.charCodeAt(i+1) << 8)
			+ (s.charCodeAt(i+2) << 16)
			+ (s.charCodeAt(i+3) << 24);
			}
			return md5blks;
		}

		var hex_chr = '0123456789abcdef'.split('');

		function rhex(n)
		{
			var s='', j=0;
			for(; j<4; j++)	s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]	+ hex_chr[(n >> (j * 8)) & 0x0F];
			return s;
		}

		function hex(x) {
			var l=x.length;
			for (var i=0; i<l; i++)	x[i] = rhex(x[i]);
			return x.join('');
		}

		return hex(md51(string));
	},

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-
  // matching strings / regexps
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-

  reMatches: function(string, re) {
    // Different to the native `match` function this method returns an object
    // with `start`, `end`, and `match` fields
    // Example:
    //   string.reMatches("Hello World", /o/g)
    //   // => [{start: 4, end: 5, match: "o"},{start: 7, end: 8, match: "o"}]
    var matches = [];
    string.replace(re, function(match, idx) {
      matches.push({match: match, start: idx, end: idx + match.length}); });
    return matches;
  },

  stringMatch: function(s, patternString, options) {
    // returns `{matched: true}` if success otherwise
    // `{matched: false, error: EXPLANATION, pattern: STRING|RE, pos: NUMBER}`
    // Example:
    //   string.stringMatch("foo 123 bar", "foo __/[0-9]+/__ bar") // => {matched: true}
    //   string.stringMatch("foo aaa bar", "foo __/[0-9]+/__ bar")
    //     // => {
    //     //   error: "foo <--UNMATCHED-->aaa bar",
    //     //   matched: false,
    //     //   pattern: /[0-9]+/,
    //     //   pos: 4
    //     // }
    options = options || {};
    if (!!options.normalizeWhiteSpace) s = s.replace(/\s+/g, ' ');
    if (!!options.ignoreIndent) {
      s = s.replace(/^\s+/gm, '');
      patternString = patternString.replace(/^\s+/gm, '');
    }
    return s == patternString ?
      {matched: true} : embeddedReMatch(s , patternString);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function splitInThree(string, start, end, startGap, endGap) {
      // split string at start and end
      // return (0, start), (start, end), (end, ...)
      startGap = startGap || 0; endGap = endGap || 0;
      return [string.slice(0, start),
          string.slice(start+startGap, end-endGap),
          string.slice(end)]
    }

    function matchStringForward(s, pattern) {
      // try to match pattern at beginning of string. if matched, return
      // result object with {
      //   match: STRING,
      //   REST: STRING -- remaining string after pattern was consumed
      // }
      if (pattern.constructor !== RegExp) {
        var idx = s.indexOf(pattern);
        if (idx === 0) return {match: pattern, rest: s.slice(pattern.length)}
        // no match
        for (var i = 0; i < pattern.length; i++) // figure out where we failed
          if (pattern[i] != s[i])
            return {match: null, pos: i};
        return {match: null};
      }
      var matches = string.reMatches(s, pattern);
      // show(matches)
      // show(string.slice(matches[0].end));
      return (!matches || !matches.length || matches[0].start !== 0) ?
        {match: null} :
        {match: matches[0].match, rest: s.slice(matches[0].end)};
    }

    function matchStringForwardWithAllPatterns(s, patterns) {
      // like matchStringForward, just apply list of patterns
      var pos = 0;
      for (var i = 0; i < patterns.length; i++) {
        var p = patterns[i],
          result = matchStringForward(s, p);
        if (!result.match) return {matched: false, pos: pos + (result.pos || 0), pattern: p}
        pos += result.match.length;
        s = result.rest;
      }
      return s.length ? {matched: false, pos: pos} : {matched: true}
    }

    function splitIntoPatterns(matcher) {
      var starts = string.reMatches(matcher, /__\//g),
          ends = string.reMatches(matcher, /\/__/g);
      if (starts.length !== ends.length) {
        throw new Error("pattern invalid: "
                + matcher
                + " cannot be split into __/.../__ embedded RegExps"
                + "\nstarts: " + JSON.stringify(starts)
                + '\nvs ends:\n' + JSON.stringify(ends));
      }
      var consumed = 0;
      return starts.reduce(function(patterns, start, i) {
        var end = ends[i];
        var matcher = patterns.pop();
        var splitted = splitInThree(
          matcher,
          start.start-consumed,
          end.end-consumed,
          3, 3);
        if (splitted[0].length) {
          patterns.push(splitted[0]);
          consumed += splitted[0].length;
        }
        try {
          if (splitted[1].length) {
            patterns.push(new RegExp(splitted[1]));
            consumed += splitted[1].length + 3 + 3;
          }
        } catch(e) {
          throw new Error("Cannot create pattern re from: " + Objects.inspect(splitted))
        }
        if (splitted[2].length) { patterns.push(splitted[2]); }
        return patterns;
      }, [matcher]);
    }

    function embeddedReMatch(s, patternString) {
      // the main match func
      var patterns = splitIntoPatterns(patternString)
      var result = matchStringForwardWithAllPatterns(s, patterns);
      if (result.matched) return result;
      result.error = s.slice(0, result.pos) + '<--UNMATCHED-->' + s.slice(result.pos)
      return result;
    }
  },

  peekRight: function(s, start, needle) {
    // Finds the next occurence of `needle` (String or RegExp). Returns delta
    // index.
    // Example:
    // string.peekRight("Hello World", 0, /o/g) // => 4
    // string.peekRight("Hello World", 5, /o/) // => 2
    s = s.slice(start);
    if (typeof needle === 'string') {
      var idx = s.indexOf(needle);
      return idx === -1 ? null : idx + start;
    } else if (needle.constructor === RegExp) {
      var matches = string.reMatches(s, needle);
      return matches[0] ? matches[0].start : null;
    }
    return null;
  },

  peekLeft: function(s, start, needle) {
    // Similar to `peekRight`
    s = s.slice(0, start);
    if (typeof needle === 'string') {
      var idx = s.lastIndexOf(needle);
      return idx === -1 ? null : idx;
    } else if (needle.constructor === RegExp) {
      var matches = string.reMatches(s, needle);
      return matches.last() ? matches.last().start : null;
    }
    return null;
  },

  lineIndexComputer: function(s) {
    // String -> Function
    // For converting character positions to line numbers.
    // Returns a function accepting char positions. If the char pos is outside
    // of the line ranges -1 is returned.
    // Example:
    // var idxComp = string.lineIndexComputer("Hello\nWorld\n\nfoo");
    // idxComp(3) // => 0 (index 3 is "l")
    // idxComp(6) // => 1 (index 6 is "W")
    // idxComp(12) // => 2 (index 12 is "\n")

    // ignore-in-doc
    // line ranges: list of numbers, each line has two entries:
    // i -> start of line, i+1 -> end of line
    var lineRanges = string.lines(s).reduce(function(lineIndexes, line) {
      var lastPos = lineIndexes.slice(-1)[0] || -1;
      return lineIndexes.concat([lastPos+1, lastPos + 1 + line.length]);
    }, []);
    // ignore-in-doc
    // FIXME, this is O(n). Make cumputation more efficient, binary lookup?
    return function(pos) {
      for (var line = 0; line < lineRanges.length; line+=2)
        if (pos >= lineRanges[line] && pos <= lineRanges[line+1])
          return line / 2;
      return -1;
    }
  },

  // -=-=-=-=-
  // diffing
  // -=-=-=-=-

  diff: function(s1, s2) {
    if (typeof JsDiff === "undefined") return 'diff not supported';
    return JsDiff.convertChangesToXML(JsDiff.diffWordsWithSpace(s1, s2));
  },

  // -=-=-=-=-
  // testing
  // -=-=-=-=-

  empty: function(s) {
    // show-in-doc
    return s == '';
  },

  include: function(s, pattern) {
    // Example:
    // string.include("fooo!", "oo") // => true
    return s.indexOf(pattern) > -1;
  },

  startsWith: function(s, pattern) {
    // Example:
    // string.startsWith("fooo!", "foo") // => true
    return s.indexOf(pattern) === 0;
  },

  startsWithVowel: function(s) {
    // show-in-doc
    var c = s[0];
    return c === 'A' || c === 'E' || c === 'I' || c === 'O' || c === 'U'
      || c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u' || false;
  },

  endsWith: function(s, pattern) {
    // Example:
    // string.endsWith("fooo!", "o!") // => true
    var d = s.length - pattern.length;
    return d >= 0 && s.lastIndexOf(pattern) === d;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // string conversion and manipulation
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  withDecimalPrecision: function(str, precision) {
    // String -> Number -> String
    // Example: string.withDecimalPrecision("1.12345678", 3) // => "1.123"
    var floatValue = parseFloat(str);
    return isNaN(floatValue) ? str : floatValue.toFixed(precision);
  },

  capitalize: function(s) {
    // Example:
    // string.capitalize("foo bar") // => "Foo bar"
    return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  },

  camelCaseString: function(s) {
    // Spaces to camels, including first char
    // Example: string.camelCaseString("foo bar baz") // => "FooBarBaz"
    return s.split(" ").invoke('capitalize').join("")
  },

  camelize: function(s) {
    // Dashes to camels, excluding first char
    // Example: string.camelize("foo-bar-baz") // => "fooBarBaz"
    var parts = s.split('-'),
        len = parts.length;
    if (len == 1) return parts[0];

    var camelized = s.charAt(0) == '-' ?
        parts[0].charAt(0).toUpperCase() + parts[0].substring(1) : parts[0];
    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
    return camelized;
  },

  truncate: function(s, length, truncation) {
    // Enforces that s is not more then `length` characters long.
    // Example:
    // string.truncate("123456789", 5) // => "12..."
    length = length || 30;
    truncation = truncation === undefined ? '...' : truncation;
    return s.length > length ?
      s.slice(0, length - truncation.length) + truncation : String(s);
  },

  regExpEscape: function(s) {
    // For creating RegExps from strings and not worrying about proper escaping
    // of RegExp special characters to literally match those.
    // Example:
    // var re = new RegExp(string.regExpEscape("fooo{20}"));
    // re.test("fooo") // => false
    // re.test("fooo{20}") // => true
    return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1')
            .replace(/\x08/g, '\\x08');
  },

  succ: function(s) {
    // Uses char code.
    // Example:
    // string.succ("a") // => "b"
    // string.succ("Z") // => "["
    return s.slice(0, s.length - 1) + String.fromCharCode(s.charCodeAt(s.length - 1) + 1);
  },

  digitValue: function() {
    // ignore-in-doc
    return this.charCodeAt(0) - "0".charCodeAt(0);
  },

  times: function(s, count) {
    // Example:
    // string.times("test", 3) // => "testtesttest"
    return count < 1 ? '' : new Array(count + 1).join(s);
  }

}

})(typeof jsext !== 'undefined' ? jsext : require('./base').jsext);
