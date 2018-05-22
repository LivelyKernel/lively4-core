import Typo from "src/external/typo.js"
import focalStorage from "src/external/focalStorage.js"

export var dictionaries = {}

export async function loadDict(name, aff, dic) {
  if (!dictionaries[name]) {
    dictionaries[name] = new Promise(async resolve => {
      var affData = await fetch(aff).then(r => r.text())
      var wordsData = await fetch(dic).then(r => r.text())
      var dictionary = new Typo( name, affData, wordsData);	
      resolve(dictionary)
    })
  }   
  return dictionaries[name]
}

export function current() {
  return loadDict(
    "en_US",
    lively4url + '/src/external/dicts/en_US.aff',
    lively4url + '/src/external/dicts/en_US.dic')  
}

current()

// copied from kofifus/ Codemirror spellchecker with typo corrections
// https://gist.github.com/kofifus/4b2f79cadc871a29439d919692099406


var spellCheckKey = "SpellcheckIngoreWords"
async function loadIgnoreDict() {
  return (await focalStorage.getItem(spellCheckKey)) || {};
}

async function saveIgnoreDict(dict) { 
  return (await focalStorage.setItem(spellCheckKey, dict));
}

export var ignoreDict

export async  function startSpellCheck(cm, typo) {
	if (!cm || !typo) return; // sanity

	// ignoreDict = {}; // dictionary of ignored words
  if (!ignoreDict ) {
    ignoreDict = await loadIgnoreDict()
  }
  
	// Define what separates a word
	var rx_word = '!\'\"#$%&()*+,-./:;<=>?@[\\]^_`{|}~ ';

	cm.spellcheckOverlay = {
		token: function(stream, state) {
			var ch = stream.peek();
			var word = "";
			if (rx_word.includes(ch) || ch === '\uE000' || ch === '\uE001') {
				stream.next();
				return null;
			}
      
      while ((ch = stream.peek()) && !rx_word.includes(ch)) {
				word += ch;
				stream.next();
			}
      // cm.doc.findMarksAt(
      // var cm = that.editor
      
      
			if (!/[a-z]/i.test(word)) return null; // no letters
			
      // console.log("w", word, "stream ", stream)
      // var token = cm.getTokenAt(cm.doc.posFromIndex(stream.pos))
      // console.log("w", word, "type ", token.type)
      // if (token.type && token.type.match("url")) return null; 

      if (ignoreDict && ignoreDict[word]) return null;
			if (!typo.check(word)) return "spell-error"; // CSS class: cm-spell-error
		}
	}
	cm.addOverlay(cm.spellcheckOverlay);

	// initialize the suggestion box
	let sbox = getSuggestionBox(typo);
	cm.getWrapperElement().oncontextmenu = (e => {
		e.preventDefault();
		e.stopPropagation();
		sbox.suggest(cm, e);
		return false;
	});
}

export function getSuggestionBox(typo) {
	function sboxShow(cm, sbox, items, x, y, hourglass) {
		let selwidget = sbox.children[0];

		var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&  navigator.userAgent && !navigator.userAgent.match('CriOS');
		let separator=(!isSafari && (hourglass || items.length>0)); // separator line does not work well on safari

		let options = '';
		items.forEach(s => options += '<option value="' + s + '">' + s + '</option>');
		if (hourglass) options += '<option disabled="disabled">&nbsp;&nbsp;&nbsp;&#8987;</option>';
		if (separator) options += '<option style="min-height:1px; max-height:1px; padding:0; background-color: #000000;" disabled>&nbsp;</option>';
		options += '<option value="##ignoreall##">Ignore&nbsp;All</option>';

		let indexInParent=[].slice.call(selwidget.parentElement.children).indexOf(selwidget);
		selwidget.innerHTML=options;
		selwidget=selwidget.parentElement.children[indexInParent];
		
		let fontSize=window.getComputedStyle(cm.getWrapperElement(), null).getPropertyValue('font-size');
		selwidget.style.fontSize=fontSize;
		selwidget.size = selwidget.length;
		if (separator) selwidget.size--;
		selwidget.value = -1;

		// position widget inside cm
		let cmrect = cm.getWrapperElement().getBoundingClientRect();
		sbox.style.left = x + 'px';
		sbox.style.top = (y - sbox.offsetHeight / 2) + 'px';
		let widgetRect = sbox.getBoundingClientRect();
		if (widgetRect.top < cmrect.top) sbox.style.top = (cmrect.top + 2) + 'px';
		if (widgetRect.right > cmrect.right) sbox.style.left = (cmrect.right - widgetRect.width - 2) + 'px';
		if (widgetRect.bottom > cmrect.bottom) sbox.style.top = (cmrect.bottom - widgetRect.height - 2) + 'px';
	}

	function sboxHide(sbox) {
		sbox.style.top = sbox.style.left = '-1000px';
		// typo.suggest(); // disable any running suggeations search
	}

	// create suggestions widget
	let sbox = document.getElementById('suggestBox');
	if (!sbox) {
		sbox = document.createElement('div');
		sbox.style.zIndex = 100000;
		sbox.id = 'suggestBox';
		sbox.style.position = 'fixed';
		sboxHide(sbox);

		let selwidget = document.createElement('select');
		selwidget.multiple = 'yes';
		sbox.appendChild(selwidget);

		sbox.suggest = (async (cm, e) => { // e is the event from cm contextmenu event
			if (!e.target.classList.contains('cm-spell-error')) return false; // not on typo

			let token = e.target.innerText;
			if (!token) return false; // sanity

			// save cm instance, token, token coordinates in sbox
			sbox.codeMirror = cm;
			sbox.token = token;
			sbox.screenPos={ x: e.pageX, y: e.pageY }
			let tokenRect = e.target.getBoundingClientRect();
			let start=cm.coordsChar({left: tokenRect.left+1, top: tokenRect.top+1});
			let end=cm.coordsChar({left: tokenRect.right-1, top: tokenRect.top+1});
			sbox.cmpos={ line: start.line, start: start.ch, end: end.ch};

			// show hourglass
			sboxShow(cm, sbox, [], e.pageX, e.pageY, true);
      
			var results = [];
			// async 
			typo.suggest(token, null, all => {
				//console.log('done');
				sboxShow(cm, sbox, results, e.pageX, e.pageY);
			}, next => {
				//console.log('found '+next);
				results.push(next);
				sboxShow(cm, sbox, results, e.pageX, e.pageY, true);
			});

			// non async 
			//sboxShow(cm, sbox, typo.suggest(token), e.pageX, e.pageY);

			e.preventDefault();

			return false;
		});

		sbox.onmouseout = (e => {
			let related=(e.relatedTarget ? e.relatedTarget.tagName : null);
			if (related!=='SELECT' && related!=='OPTION') sboxHide(sbox)
		});

		selwidget.onchange = (e => {
			sboxHide(sbox)
			let cm = sbox.codeMirror, correction = e.target.value;
			if (correction == '##ignoreall##') {
        
				ignoreDict[sbox.token] = true;
        saveIgnoreDict(ignoreDict);
				cm.setOption('maxHighlightLength', (--cm.options.maxHighlightLength) + 1); // ugly hack to rerun overlays
			} else {
				cm.replaceRange(correction, { line: sbox.cmpos.line, ch: sbox.cmpos.start}, { line: sbox.cmpos.line, ch: sbox.cmpos.end});
				cm.focus();
				cm.setCursor({line: sbox.cmpos.line, ch: sbox.cmpos.start+correction.length});
			}
		});

		document.body.appendChild(sbox);
	}

	return sbox;
}