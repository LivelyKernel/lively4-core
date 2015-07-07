module('users.timfelgentreff.midijs.midi').requires('users.timfelgentreff.midijs.libtimidity').toRun(function() {
  // Patch everything onto module
  var global = users.timfelgentreff.midijs.midi;
  var Module = users.timfelgentreff.midijs.libtimidity.Module;

// From: http://midijs.net/lib/midi.js

// MIDI.js 
//
// 100% JavaScript MIDI File Player using W3C Web Audio API 
// with fallbacks for older browsers
// 
// Copyrights Johannes Feulner, Karlsruhe, Germany, 2014. All rights reserved.
// Contact: weblily@weblily.net
//
 
  var audioMethod;
  var context = 0;
  var source = 0;
  var audioBufferSize = 8192;
  var waveBuffer;
  var midiFileBuffer;
  var read_wave_bytes = 0;
  var song = 0;
  var midijs_url = new URL(module('users.timfelgentreff.midijs.midi').uri()).asDirectory().dirname();
  var start_time = 0;
  var audio_status = "";

  function browserVersion() { 
	var nVer = navigator.appVersion;
	var nAgt = navigator.userAgent;
	var browserName  = navigator.appName;
	var fullVersion  = ''+parseFloat(navigator.appVersion); 
	var majorVersion = parseInt(navigator.appVersion,10);
	var nameOffset,verOffset,ix;

	// In Opera, the true version is after "Opera" or after "Version"
	if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
	 browserName = "Opera";
	 fullVersion = nAgt.substring(verOffset+6);
	 if ((verOffset=nAgt.indexOf("Version"))!=-1) 
	   fullVersion = nAgt.substring(verOffset+8);
	}
	// In MSIE, the true version is after "MSIE" in userAgent
	else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
	 browserName = "Microsoft Internet Explorer";
	 fullVersion = nAgt.substring(verOffset+5);
	}
	// Since IE 11, "MSIE" is not part of the user Agent
        // the true version is after "rv"?
	else if ((verOffset=nAgt.indexOf("Trident"))!=-1) {
	 browserName = "Microsoft Internet Explorer";
         if ((verOffset=nAgt.indexOf("rv:"))!=-1) { 
	   fullVersion = nAgt.substring(verOffset+3);
          } else  {
           fullVersion = '0.0'; // hm?
          }
        }
	// In Chrome, the true version is after "Chrome" 
	else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
	 browserName = "Chrome";
	 fullVersion = nAgt.substring(verOffset+7);
	}
	// The default Andorid Browser does not have "Chrome" in its userAgent
	else if ((verOffset=nAgt.indexOf("Android"))!=-1) {
	 browserName = "Android";
	 fullVersion = nAgt.substring(verOffset+8);
	}
	// In Safari, the true version is after "Safari" or after "Version" 
	else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
	 browserName = "Safari";
	 fullVersion = nAgt.substring(verOffset+7);
	 if ((verOffset=nAgt.indexOf("Version"))!=-1) 
	   fullVersion = nAgt.substring(verOffset+8);
	}
	// In Firefox, the true version is after "Firefox" 
	else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
	 browserName = "Firefox";
	 fullVersion = nAgt.substring(verOffset+8);
	}
	// In most other browsers, "name/version" is at the end of userAgent 
	else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) < 
		  (verOffset=nAgt.lastIndexOf('/')) ) 
	{
	 browserName = nAgt.substring(nameOffset,verOffset);
	 fullVersion = nAgt.substring(verOffset+1);
	 if (browserName.toLowerCase()==browserName.toUpperCase()) {
	  browserName = navigator.appName;
	 }
	}
	// trim the fullVersion string at semicolon/space if present
	if ((ix=fullVersion.indexOf(";"))!=-1)
	   fullVersion=fullVersion.substring(0,ix);
	if ((ix=fullVersion.indexOf(" "))!=-1)
	   fullVersion=fullVersion.substring(0,ix);

	majorVersion = parseInt(''+fullVersion,10);
	if (isNaN(majorVersion)) {
	 fullVersion  = ''+parseFloat(navigator.appVersion); 
	 majorVersion = parseInt(navigator.appVersion,10);
	}

        var bv = new Object();
        bv.browserName = browserName;
        bv.fullVersion = fullVersion;
        bv.majorVersion = majorVersion;
        bv.appName = navigator.appName;
        bv.userAgent = navigator.userAgent;
        bv.platform = navigator.platform;

        return bv;
  }

  function require_script(file, callback) {

    var script = document.getElementsByTagName('script')[0],
        newjs = document.createElement('script');

    // IE
    newjs.onreadystatechange = function () {
      if (newjs.readyState === 'loaded' || newjs.readyState === 'complete') {
        newjs.onreadystatechange = null;
        callback();
      }
    };

    // others
    newjs.onload = function () {
      callback();
    }; 

    newjs.onerror = function() {
      MIDIjs.message_callback('Error: Cannot load  JavaScript filet ' + file);
      return;
    }

    newjs.src = file;
    newjs.type = 'text/javascript';
    script.parentNode.insertBefore(newjs, script);
  }

  function get_next_wave(ev) {
    var player_event = new Object();
    player_event.time = context.currentTime - start_time;
    MIDIjs.player_callback(player_event);
    // collect new wave data from libtimidity into waveBuffer
    read_wave_bytes = Module.ccall('mid_song_read_wave', 'number', 
                                   ['number', 'number', 'number', 'number'], 
                                   [song, waveBuffer, audioBufferSize * 2, false]);
    if (0 == read_wave_bytes) {
       stop_WebAudioAPI();
       return;
    }

    var max_i16 = Math.pow(2,15);
    for (var i = 0; i < audioBufferSize; i++) {
      if (i < read_wave_bytes) {
        // convert PCM data from C sint16 to JavaScript number (range -1.0 .. +1.0)
        ev.outputBuffer.getChannelData(0)[i] = Module.getValue(waveBuffer + 2 * i, 'i16') / max_i16; 
      } else {
        MIDIjs.message_callback("Filling 0 at end of buffer");
        ev.outputBuffer.getChannelData(0)[i] = 0;   // fill end of buffer with zeroes, may happen at the end of a piece
      }
    }
  }

  function loadMissingPatch(path, filename) {
    var request = new XMLHttpRequest();
    request.open('GET', path + filename, true);
    request.responseType = 'arraybuffer';

    request.onerror = function() {
      MIDIjs.message_callback("Error: Cannot retrieve patch file " + path + filename);
    }

    request.onload = function() {
      if (200 != request.status) {
          MIDIjs.message_callback("Error: Cannot retrieve patch filee " + path + filename + " : " + request.status);
          return;
      }

      num_missing--;
      Module.FS_createDataFile('pat/', filename, new Int8Array(request.response), true, true);
      MIDIjs.message_callback("Loading instruments: " + num_missing);
      if (num_missing == 0) {
        stream =  Module.ccall('mid_istream_open_mem', 'number', 
                               ['number', 'number', 'number'], 
                               [midiFileBuffer, midiFileArray.length , false]);
        var MID_AUDIO_S16LSB = 0x8010; // signed 16-bit samples
        var options = Module.ccall('mid_create_options', 'number', 
                                   ['number', 'number', 'number', 'number'], 
                                   [context.sampleRate, MID_AUDIO_S16LSB, 1, audioBufferSize * 2]);
        song = Module.ccall('mid_song_load', 'number', ['number', 'number'], [stream, options]);
        rval =  Module.ccall('mid_istream_close', 'number', ['number'], [stream]);
        Module.ccall('mid_song_start', 'void', ['number'], [song]);

        // create script Processor with buffer of size audioBufferSize and a single output channel
        source = context.createScriptProcessor(audioBufferSize, 0, 1);  
        waveBuffer = Module._malloc(audioBufferSize * 2);
        source.onaudioprocess = get_next_wave;        // add eventhandler for next buffer full of audio data
        source.connect(context.destination);          // connect the source to the context's destination (the speakers)
        start_time = context.currentTime;
        MIDIjs.message_callback('Playing: ...');
      }
    }
    request.send();
  }

  function unmute_iOS_hack() {
    // iOS unmutes web audio when playing a buffer source
    // the buffer may be initialized to all zeroes (=silence)
    var sinusBuffer = context.createBuffer(1, 44100, 44100);
    freq = 440; // Hz
    for (i = 0; i < 48000; i++) {
      sinusBuffer.getChannelData(0)[i] = 0; // Math.sin(i / 48000 * 2 * Math.PI * freq); 
    } 
    var bufferSource = context.createBufferSource();    // creates a sound source
    bufferSource.buffer = sinusBuffer;  
    bufferSource.connect(context.destination);          // connect the source to the context's destination (the speakers)
    bufferSource.start(0); // play the bufferSource now        
  }
    
  function play_WebAudioAPI(url) {
    stop_WebAudioAPI();
    play_WebAudioAPI_with_script_loaded(url);
    return;
  }
  
  function play_WebAudioAPIString(string) {
    debugger
    stop_WebAudioAPI();
    var buf = new ArrayBuffer(string.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=string.length; i < strLen; i++) {
        bufView[i] = string.charCodeAt(i);
    }
    playTimidity(buf);
}
function playTimidity(string) {
      midiFileArray = new Int8Array(string);
      midiFileBuffer = Module._malloc(midiFileArray.length);
      Module.writeArrayToMemory(midiFileArray, midiFileBuffer);

      rval = Module.ccall('mid_init', 'number', [], []);
      stream =  Module.ccall('mid_istream_open_mem', 'number', 
                             ['number', 'number', 'number'], 
                             [midiFileBuffer, midiFileArray.length , false]);
      var MID_AUDIO_S16LSB = 0x8010; // signed 16-bit samples
      var options = Module.ccall('mid_create_options', 'number', 
                                 ['number', 'number', 'number', 'number'], 
                                 [context.sampleRate, MID_AUDIO_S16LSB, 1, audioBufferSize * 2]);
      song = Module.ccall('mid_song_load', 'number', ['number', 'number'], [stream, options]);
      rval =  Module.ccall('mid_istream_close', 'number', ['number'], [stream]);

      num_missing = Module.ccall('mid_song_get_num_missing_instruments', 'number', ['number'], [song]);
      if (0 < num_missing) {
        for(var i = 0; i < num_missing; i++) {
          var missingPatch = Module.ccall('mid_song_get_missing_instrument', 'string', ['number', 'number'], [song, i]);
          loadMissingPatch(midijs_url + "pat/", missingPatch);
        }
      } else {
        Module.ccall('mid_song_start', 'void', ['number'], [song]);
        // create script Processor with auto buffer size and a single output channel
        source = context.createScriptProcessor(audioBufferSize, 0, 1);  
        waveBuffer = Module._malloc(audioBufferSize * 2);
        source.onaudioprocess = get_next_wave;    // add eventhandler for next buffer full of audio data
        source.connect(context.destination);      // connect the source to the context's destination (the speakers)
        start_time = context.currentTime;
        MIDIjs.message_callback("Playing: ...");
      }
      return;
  }

  function play_WebAudioAPI_with_script_loaded(url) {

    // Download url from server, url must honor same origin restriction
    MIDIjs.message_callback('Loading MIDI file ' + url + ' ...');
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    
    request.onerror = function() {
      MIDIjs.message_callback('Error: Cannot retrieve MIDI file ' + url);
    }

    request.onload = function() {
      if (200 != request.status) {
        MIDIjs.message_callback('Error: Cannot retrieve MIDI file ' + url  + " : " + request.status);
        return;
      }

      MIDIjs.message_callback("MIDI file loaded: " + url);

      playTimidity(request.response);
    }
    request.send();
  }
  
  function stop_WebAudioAPI() {
    if (source) {
      // terminate playback
      source.disconnect();
      
      // hack: without this, Firfox 25 keeps firing the onaudioprocess callback
      source.onaudioprocess = 0; 

      source = 0;

      // free libtimitdiy ressources
      Module._free(waveBuffer);
      Module._free(midiFileBuffer);
      Module.ccall('mid_song_free', 'void', ['number'], [song]);
      song = 0;
      Module.ccall('mid_exit', 'void', [], []);
      source = 0;
    }
    MIDIjs.message_callback(audio_status);
    var player_event = new Object;
    player_event.time = 0;
    MIDIjs.player_callback(player_event);
  }

  function play_bgsound(url) {
    stop_bgsound();

    var sounddiv = document.getElementById('scorioMIDI');
    if (!sounddiv) {
      sounddiv = document.createElement('div');
      sounddiv.setAttribute('id', 'scorioMIDI');
        
      // hack: without the nbsp or some other character the bgsound will not be inserted
      sounddiv.innerHTML = '&nbsp;<bgsound src="' + url + '" volume="100"/>';
      document.body.appendChild(sounddiv);
    } else {
      sounddiv.lastChild.setAttribute('src', url);
    }
    source = sounddiv;
    MIDIjs.message_callback('Playing ' + url + ' ...');
  }

  function stop_bgsound() {
    if (source) {
      var sounddiv = source;
      sounddiv.lastChild.setAttribute('src', 'midi/silence.mid');
      source = 0;
    }
    MIDIjs.message_callback(audio_status);
  }

  function play_object(url) {
    stop_object();

    var sounddiv = document.getElementById('scorioMIDI');
    if (!sounddiv) {
      sounddiv = document.createElement('div');
      sounddiv.setAttribute('id', 'scorioMIDI');
        
      sounddiv.innerHTML = '<object data="' + url + '" autostart="true" volume="100" type="audio/mid"></object>';
      document.body.appendChild(sounddiv);
    } else {
      sounddiv.lastChild.setAttribute('data', url);
    }
    source = sounddiv;
    MIDIjs.message_callback('Playing ' + url + ' ...');
  }

  function stop_object() {
    if (source) {
      var sounddiv = source;
     
      sounddiv.parentNode.removeChild(sounddiv);
      source = 0;
    }
    MIDIjs.message_callback(audio_status);
  }

  var bv = browserVersion();
  try {
    if ((bv.platform == "iPhone" || bv.platform == "iPod" || bv.platform == "iPad") 
        && bv.majorVersion <= 6) {
       audioMethod = 'none';
    } else { 
      // Fix up for prefixing
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      audioMethod = 'WebAudioAPI'
    }
  }
  catch(e) {
    if (bv.browserName == 'Microsoft Internet Explorer') {
      audioMethod = 'bgsound';
    } else if (bv.browserName == "Android") {
      audioMethod = 'none';
    } else {
      audioMethod = 'object';
    }
  }
 
  //alert('Browser name  = '+bv.browserName+'<br>'
  //+'Full version  = '+bv.fullVersion+'<br>'
  //+'Major version = '+bv.majorVersion+'<br>'
  //+'navigator.appName = '+bv.appName+'<br>'
  //+'navigator.userAgent = '+bv.userAgent+'<br>'
  //+'navigator.platform = '+bv.platform+'<br>');

  global.MIDIjs = new Object(); 
  var MIDIjs = global.MIDIjs;

  // default: write messages to browser console
  global.MIDIjs.message_callback = function(message) { console.log(message); };
  global.MIDIjs.player_callback = function(player_event) { return; };
  global.MIDIjs.get_audio_status = function() { return audio_status; };

  global.MIDIjs.unmute_iOS_hack = unmute_iOS_hack;

  if (audioMethod == "WebAudioAPI") {
    global.MIDIjs.play = play_WebAudioAPI;
    global.MIDIjs.playString = play_WebAudioAPIString;
    global.MIDIjs.stop = stop_WebAudioAPI;
    audio_status = "audioMethod: WebAudioAPI" +
                   ", sampleRate (Hz): " + context.sampleRate + 
                   ", audioBufferSize (Byte): " + audioBufferSize;
  } else if (audioMethod == 'bgsound') {
    global.MIDIjs.play = play_bgsound;
    global.MIDIjs.stop = stop_bgsound;
    audio_status = "audioMethod: &lt;bgsound&gt;";
  } else if (audioMethod == 'object') {
    global.MIDIjs.play = play_object;
    global.MIDIjs.stop = stop_object;
    audio_status = "audioMethod: &lt;object&gt;";
  } else {
    global.MIDIjs.play = function(url) {};
    global.MIDIjs.stop = function(url) {};
    audio_status = "audioMethod: No method found";
  }
}) // end of module
