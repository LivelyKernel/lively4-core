# Transpilation Examples

## Original JavaScript Module with async, classes and other features

```JS
import focalStorage from './../external/focalStorage.js'
import generateUuid from './uuid.js'

export default class Files {
  static fetchChunks(fetchPromise, eachChunkCB, doneCB) {
    fetchPromise.then(function(response) {
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var all = "";
        (function read() {
          reader.read().then(function(result) {
            var text = decoder.decode(result.value || new Uint8Array, {
              stream: !result.done
            });
            all += text
            if (eachChunkCB) eachChunkCB(text, result)
            if (result.done) {
              if (doneCB) doneCB(all, result)
            } else {
              read() // fetch next chunk
            }
          })
        })()
      })
  }

  // #depricated, use fetch directly
  static async loadFile(url, version) {
    return fetch(url, {
      headers: {
        fileversion: version
      }
    }).then(function (response) {
      console.log("file " + url + " read.");
      return response.text();
    })
  }

  // #depricated
  static async saveFile(url, data){
    var urlString = url.toString();
    if (urlString.match(/\/$/)) {
      return fetch(urlString, {method: 'MKCOL'});
    } else {
      return fetch(urlString, {method: 'PUT', body: data});
    }
  }
  
  static async statFile(urlString){
  	return fetch(urlString, {method: 'OPTIONS'}).then(resp => resp.text())
  }

}
```


## lively.modules intermediate code

```JS
var __lvVarRecorder = System.get("@lively-env").moduleEnv("https://lively-kernel.org/lively4/lively4-core/src/client/files.js").recorder;'use strict';
import focalStorage from './../external/focalStorage.js';
__lvVarRecorder.focalStorage = focalStorage;
import generateUuid from './uuid.js';
__lvVarRecorder.generateUuid = generateUuid;
var Files = __lvVarRecorder['lively.capturing-declaration-wrapper']('Files', 'class', __lvVarRecorder.createOrExtendES6ClassForLively('Files', undefined, undefined, [
    {
        key: 'fetchChunks',
        value: function Files_fetchChunks_(fetchPromise, eachChunkCB, doneCB) {
            fetchPromise.then(function (response) {
                var reader = response.body.getReader();
                var decoder = new __lvVarRecorder.TextDecoder();
                var all = '';
                (function read() {
                    reader.read().then(function (result) {
                        var text = decoder.decode(result.value || new __lvVarRecorder.Uint8Array(), { stream: !result.done });
                        all += text;
                        if (eachChunkCB)
                            eachChunkCB(text, result);
                        if (result.done) {
                            if (doneCB)
                                doneCB(all, result);
                        } else {
                            read();
                        }
                    });
                }());
            });
        }
    },
    {
        key: 'loadFile',
        value: async function Files_loadFile_(url, version) {
            return fetch(url, { headers: { fileversion: version } }).then(function (response) {
                console.log('file ' + url + ' read.');
                return response.text();
            });
        }
    },
    {
        key: 'saveFile',
        value: async function Files_saveFile_(url, data) {
            var urlString = url.toString();
            if (urlString.match(/\/$/)) {
                return fetch(urlString, { method: 'MKCOL' });
            } else {
                return fetch(urlString, {
                    method: 'PUT',
                    body: data
                });
            }
        }
    },
    {
        key: 'statFile',
        value: async function Files_statFile_(urlString) {
            return fetch(urlString, {
                method: 'OPTIONS',
                body: __lvVarRecorder.data
            }).then((resp) => resp.text());
        }
    }
], __lvVarRecorder, System.get('@lively-env').moduleEnv('https://lively-kernel.org/lively4/lively4-core/src/client/files.js')), __lvVarRecorder);
Files = __lvVarRecorder.Files;
export default Files;
System.get("@lively-env").evaluationDone("https://lively-kernel.org/lively4/lively4-core/src/client/files.js");
```

## SystemJS/babel5 compiles lively.modules 

```JS
(function(System, SystemJS) {(function(__moduleName){System.register(["./../external/focalStorage.js", "./uuid.js"], function (_export) {
    "use strict";

    var focalStorage, generateUuid, __lvVarRecorder, Files;

    return {
        setters: [function (_externalFocalStorageJs) {
            focalStorage = _externalFocalStorageJs["default"];
        }, function (_uuidJs) {
            generateUuid = _uuidJs["default"];
        }],
        execute: function () {
            __lvVarRecorder = System.get("@lively-env").moduleEnv("https://lively-kernel.org/lively4/lively4-core/src/client/files.js").recorder;
            'use strict';

            __lvVarRecorder.focalStorage = focalStorage;

            __lvVarRecorder.generateUuid = generateUuid;
            Files = __lvVarRecorder['lively.capturing-declaration-wrapper']('Files', 'class', __lvVarRecorder.createOrExtendES6ClassForLively('Files', undefined, undefined, [{
                key: 'fetchChunks',
                value: function Files_fetchChunks_(fetchPromise, eachChunkCB, doneCB) {
                    fetchPromise.then(function (response) {
                        var reader = response.body.getReader();
                        var decoder = new __lvVarRecorder.TextDecoder();
                        var all = '';
                        (function read() {
                            reader.read().then(function (result) {
                                var text = decoder.decode(result.value || new __lvVarRecorder.Uint8Array(), { stream: !result.done });
                                all += text;
                                if (eachChunkCB) eachChunkCB(text, result);
                                if (result.done) {
                                    if (doneCB) doneCB(all, result);
                                } else {
                                    read();
                                }
                            });
                        })();
                    });
                }
            }, {
                key: 'loadFile',
                value: function Files_loadFile_(url, version) {
                    return regeneratorRuntime.async(function Files_loadFile_$(context$1$0) {
                        while (1) switch (context$1$0.prev = context$1$0.next) {
                            case 0:
                                return context$1$0.abrupt("return", fetch(url, { headers: { fileversion: version } }).then(function (response) {
                                    console.log('file ' + url + ' read.');
                                    return response.text();
                                }));

                            case 1:
                            case "end":
                                return context$1$0.stop();
                        }
                    }, null, this);
                }
            }, {
                key: 'saveFile',
                value: function Files_saveFile_(url, data) {
                    var urlString;
                    return regeneratorRuntime.async(function Files_saveFile_$(context$1$0) {
                        while (1) switch (context$1$0.prev = context$1$0.next) {
                            case 0:
                                urlString = url.toString();

                                if (!urlString.match(/\/$/)) {
                                    context$1$0.next = 5;
                                    break;
                                }

                                return context$1$0.abrupt("return", fetch(urlString, { method: 'MKCOL' }));

                            case 5:
                                return context$1$0.abrupt("return", fetch(urlString, {
                                    method: 'PUT',
                                    body: data
                                }));

                            case 6:
                            case "end":
                                return context$1$0.stop();
                        }
                    }, null, this);
                }
            }, {
                key: 'statFile',
                value: function Files_statFile_(urlString) {
                    return regeneratorRuntime.async(function Files_statFile_$(context$1$0) {
                        while (1) switch (context$1$0.prev = context$1$0.next) {
                            case 0:
                                return context$1$0.abrupt("return", fetch(urlString, {
                                    method: 'OPTIONS',
                                    body: __lvVarRecorder.data
                                }).then(function (resp) {
                                    return resp.text();
                                }));

                            case 1:
                            case "end":
                                return context$1$0.stop();
                        }
                    }, null, this);
                }
            }], __lvVarRecorder, System.get('@lively-env').moduleEnv('https://lively-kernel.org/lively4/lively4-core/src/client/files.js')), __lvVarRecorder);

            Files = __lvVarRecorder.Files;

            _export("default", Files);

            System.get("@lively-env").evaluationDone("https://lively-kernel.org/lively4/lively4-core/src/client/files.js");
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9 ..snip.. zXCIpQ==
})("https://lively-kernel.org/lively4/lively4-core/src/client/files.js");
})(System, System);
```

## SystemJS / Babel6 with ES2015 and StagesX enabled

```JS
(function(System, SystemJS) {'use strict';

System.register(['https://lively-kernel.org/lively4/lively4-jens/src/external/babel/regenerator-runtime.js', 'https://lively-kernel.org/lively4/lively4-jens/src/external/babel/babel-helpers/asyncToGenerator.js', 'https://lively-kernel.org/lively4/lively4-jens/src/external/babel/babel-helpers/classCallCheck.js', 'https://lively-kernel.org/lively4/lively4-jens/src/external/babel/babel-helpers/createClass.js', './../external/focalStorage.js', './uuid.js'], function (_export, _context) {
  "use strict";

  var _regeneratorRuntime, _asyncToGenerator, _classCallCheck, _createClass, focalStorage, generateUuid, Files;

  return {
    setters: [function (_httpsLivelyKernelOrgLively4Lively4JensSrcExternalBabelRegeneratorRuntimeJs) {
      _regeneratorRuntime = _httpsLivelyKernelOrgLively4Lively4JensSrcExternalBabelRegeneratorRuntimeJs.default;
    }, function (_httpsLivelyKernelOrgLively4Lively4JensSrcExternalBabelBabelHelpersAsyncToGeneratorJs) {
      _asyncToGenerator = _httpsLivelyKernelOrgLively4Lively4JensSrcExternalBabelBabelHelpersAsyncToGeneratorJs.default;
    }, function (_httpsLivelyKernelOrgLively4Lively4JensSrcExternalBabelBabelHelpersClassCallCheckJs) {
      _classCallCheck = _httpsLivelyKernelOrgLively4Lively4JensSrcExternalBabelBabelHelpersClassCallCheckJs.default;
    }, function (_httpsLivelyKernelOrgLively4Lively4JensSrcExternalBabelBabelHelpersCreateClassJs) {
      _createClass = _httpsLivelyKernelOrgLively4Lively4JensSrcExternalBabelBabelHelpersCreateClassJs.default;
    }, function (_externalFocalStorageJs) {
      focalStorage = _externalFocalStorageJs.default;
    }, function (_uuidJs) {
      generateUuid = _uuidJs.default;
    }],
    execute: function () {
      Files = function () {
        function Files() {
          _classCallCheck(this, Files);
        }

        _createClass(Files, null, [{
          key: 'fetchChunks',
          value: function fetchChunks(fetchPromise, eachChunkCB, doneCB) {
            fetchPromise.then(function (response) {
              var reader = response.body.getReader();
              var decoder = new TextDecoder();
              var all = "";
              (function read() {
                reader.read().then(function (result) {
                  var text = decoder.decode(result.value || new Uint8Array(), {
                    stream: !result.done
                  });
                  all += text;
                  if (eachChunkCB) eachChunkCB(text, result);
                  if (result.done) {
                    if (doneCB) doneCB(all, result);
                  } else {
                    read(); // fetch next chunk
                  }
                });
              })();
            });
          }
        }, {
          key: 'loadFile',
          value: function () {
            var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(url, version) {
              return _regeneratorRuntime.wrap(function _callee$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      return _context2.abrupt('return', fetch(url, {
                        headers: {
                          fileversion: version
                        }
                      }).then(function (response) {
                        console.log("file " + url + " read.");
                        return response.text();
                      }));

                    case 1:
                    case 'end':
                      return _context2.stop();
                  }
                }
              }, _callee, this);
            }));

            function loadFile(_x, _x2) {
              return _ref.apply(this, arguments);
            }

            return loadFile;
          }()
        }, {
          key: 'saveFile',
          value: function () {
            var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(url, data) {
              var urlString;
              return _regeneratorRuntime.wrap(function _callee2$(_context3) {
                while (1) {
                  switch (_context3.prev = _context3.next) {
                    case 0:
                      urlString = url.toString();

                      if (!urlString.match(/\/$/)) {
                        _context3.next = 5;
                        break;
                      }

                      return _context3.abrupt('return', fetch(urlString, { method: 'MKCOL' }));

                    case 5:
                      return _context3.abrupt('return', fetch(urlString, { method: 'PUT', body: data }));

                    case 6:
                    case 'end':
                      return _context3.stop();
                  }
                }
              }, _callee2, this);
            }));

            function saveFile(_x3, _x4) {
              return _ref2.apply(this, arguments);
            }

            return saveFile;
          }()
        }, {
          key: 'statFile',
          value: function () {
            var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(urlString) {
              return _regeneratorRuntime.wrap(function _callee3$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      return _context4.abrupt('return', fetch(urlString, { method: 'OPTIONS' }).then(function (resp) {
                        return resp.text();
                      }));

                    case 1:
                    case 'end':
                      return _context4.stop();
                  }
                }
              }, _callee3, this);
            }));

            function statFile(_x5) {
              return _ref3.apply(this, arguments);
            }

            return statFile;
          }()
        }]);

        return Files;
      }();

      _export('default', Files);
    }
  };
});
})(System, System);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vbGl2ZWx5LWtlcm5lbC5vcmcvbGl2ZWx5NC9saXZlbHk0LWplbnMvc3JjL2NsaWVudC9maWxlcy5qcyJdLCJuYW1lcyI6WyJmb2NhbFN0b3JhZ2UiLCJnZW5lcmF0ZVV1aWQiLCJGaWxlcyIsImZldGNoUHJvbWlzZSIsImVhY2hDaHVua0NCIiwiZG9uZUNCIiwidGhlbiIsInJlc3BvbnNlIiwicmVhZGVyIiwiYm9keSIsImdldFJlYWRlciIsImRlY29kZXIiLCJUZXh0RGVjb2RlciIsImFsbCIsInJlYWQiLCJyZXN1bHQiLCJ0ZXh0IiwiZGVjb2RlIiwidmFsdWUiLCJVaW50OEFycmF5Iiwic3RyZWFtIiwiZG9uZSIsInVybCIsInZlcnNpb24iLCJmZXRjaCIsImhlYWRlcnMiLCJmaWxldmVyc2lvbiIsImNvbnNvbGUiLCJsb2ciLCJkYXRhIiwidXJsU3RyaW5nIiwidG9TdHJpbmciLCJtYXRjaCIsIm1ldGhvZCIsInJlc3AiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztBQUVPQSxrQjs7QUFDQUMsa0I7OztBQUVjQyxXOzs7Ozs7O3NDQUNBQyxZLEVBQWNDLFcsRUFBYUMsTSxFQUFRO0FBQ3BERix5QkFBYUcsSUFBYixDQUFrQixVQUFTQyxRQUFULEVBQW1CO0FBQ2pDLGtCQUFJQyxTQUFTRCxTQUFTRSxJQUFULENBQWNDLFNBQWQsRUFBYjtBQUNBLGtCQUFJQyxVQUFVLElBQUlDLFdBQUosRUFBZDtBQUNBLGtCQUFJQyxNQUFNLEVBQVY7QUFDQSxlQUFDLFNBQVNDLElBQVQsR0FBZ0I7QUFDZk4sdUJBQU9NLElBQVAsR0FBY1IsSUFBZCxDQUFtQixVQUFTUyxNQUFULEVBQWlCO0FBQ2xDLHNCQUFJQyxPQUFPTCxRQUFRTSxNQUFSLENBQWVGLE9BQU9HLEtBQVAsSUFBZ0IsSUFBSUMsVUFBSixFQUEvQixFQUErQztBQUN4REMsNEJBQVEsQ0FBQ0wsT0FBT007QUFEd0MsbUJBQS9DLENBQVg7QUFHQVIseUJBQU9HLElBQVA7QUFDQSxzQkFBSVosV0FBSixFQUFpQkEsWUFBWVksSUFBWixFQUFrQkQsTUFBbEI7QUFDakIsc0JBQUlBLE9BQU9NLElBQVgsRUFBaUI7QUFDZix3QkFBSWhCLE1BQUosRUFBWUEsT0FBT1EsR0FBUCxFQUFZRSxNQUFaO0FBQ2IsbUJBRkQsTUFFTztBQUNMRCwyQkFESyxDQUNFO0FBQ1I7QUFDRixpQkFYRDtBQVlELGVBYkQ7QUFjRCxhQWxCSDtBQW1CRDs7OzttRkFHcUJRLEcsRUFBS0MsTzs7Ozs7d0RBQ2xCQyxNQUFNRixHQUFOLEVBQVc7QUFDaEJHLGlDQUFTO0FBQ1BDLHVDQUFhSDtBQUROO0FBRE8sdUJBQVgsRUFJSmpCLElBSkksQ0FJQyxVQUFVQyxRQUFWLEVBQW9CO0FBQzFCb0IsZ0NBQVFDLEdBQVIsQ0FBWSxVQUFVTixHQUFWLEdBQWdCLFFBQTVCO0FBQ0EsK0JBQU9mLFNBQVNTLElBQVQsRUFBUDtBQUNELHVCQVBNLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cUZBV2FNLEcsRUFBS08sSTs7Ozs7O0FBQ3JCQywrQixHQUFZUixJQUFJUyxRQUFKLEU7OzJCQUNaRCxVQUFVRSxLQUFWLENBQWdCLEtBQWhCLEM7Ozs7O3dEQUNLUixNQUFNTSxTQUFOLEVBQWlCLEVBQUNHLFFBQVEsT0FBVCxFQUFqQixDOzs7d0RBRUFULE1BQU1NLFNBQU4sRUFBaUIsRUFBQ0csUUFBUSxLQUFULEVBQWdCeEIsTUFBTW9CLElBQXRCLEVBQWpCLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cUZBSVdDLFM7Ozs7O3dEQUNkTixNQUFNTSxTQUFOLEVBQWlCLEVBQUNHLFFBQVEsU0FBVCxFQUFqQixFQUFzQzNCLElBQXRDLENBQTJDO0FBQUEsK0JBQVE0QixLQUFLbEIsSUFBTCxFQUFSO0FBQUEsdUJBQTNDLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt5QkE5Q1dkLEsiLCJmaWxlIjoiZmlsZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBmb2NhbFN0b3JhZ2UgZnJvbSAnLi8uLi9leHRlcm5hbC9mb2NhbFN0b3JhZ2UuanMnXG5pbXBvcnQgZ2VuZXJhdGVVdWlkIGZyb20gJy4vdXVpZC5qcydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsZXMge1xuICBzdGF0aWMgZmV0Y2hDaHVua3MoZmV0Y2hQcm9taXNlLCBlYWNoQ2h1bmtDQiwgZG9uZUNCKSB7XG4gICAgZmV0Y2hQcm9taXNlLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IHJlc3BvbnNlLmJvZHkuZ2V0UmVhZGVyKCk7XG4gICAgICAgIHZhciBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG4gICAgICAgIHZhciBhbGwgPSBcIlwiO1xuICAgICAgICAoZnVuY3Rpb24gcmVhZCgpIHtcbiAgICAgICAgICByZWFkZXIucmVhZCgpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgICB2YXIgdGV4dCA9IGRlY29kZXIuZGVjb2RlKHJlc3VsdC52YWx1ZSB8fCBuZXcgVWludDhBcnJheSwge1xuICAgICAgICAgICAgICBzdHJlYW06ICFyZXN1bHQuZG9uZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhbGwgKz0gdGV4dFxuICAgICAgICAgICAgaWYgKGVhY2hDaHVua0NCKSBlYWNoQ2h1bmtDQih0ZXh0LCByZXN1bHQpXG4gICAgICAgICAgICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICAgICAgaWYgKGRvbmVDQikgZG9uZUNCKGFsbCwgcmVzdWx0KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVhZCgpIC8vIGZldGNoIG5leHQgY2h1bmtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KSgpXG4gICAgICB9KVxuICB9XG5cbiAgLy8gI2RlcHJpY2F0ZWQsIHVzZSBmZXRjaCBkaXJlY3RseVxuICBzdGF0aWMgYXN5bmMgbG9hZEZpbGUodXJsLCB2ZXJzaW9uKSB7XG4gICAgcmV0dXJuIGZldGNoKHVybCwge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBmaWxldmVyc2lvbjogdmVyc2lvblxuICAgICAgfVxuICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICBjb25zb2xlLmxvZyhcImZpbGUgXCIgKyB1cmwgKyBcIiByZWFkLlwiKTtcbiAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XG4gICAgfSlcbiAgfVxuXG4gIC8vICNkZXByaWNhdGVkXG4gIHN0YXRpYyBhc3luYyBzYXZlRmlsZSh1cmwsIGRhdGEpe1xuICAgIHZhciB1cmxTdHJpbmcgPSB1cmwudG9TdHJpbmcoKTtcbiAgICBpZiAodXJsU3RyaW5nLm1hdGNoKC9cXC8kLykpIHtcbiAgICAgIHJldHVybiBmZXRjaCh1cmxTdHJpbmcsIHttZXRob2Q6ICdNS0NPTCd9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZldGNoKHVybFN0cmluZywge21ldGhvZDogJ1BVVCcsIGJvZHk6IGRhdGF9KTtcbiAgICB9XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBzdGF0RmlsZSh1cmxTdHJpbmcpe1xuICBcdHJldHVybiBmZXRjaCh1cmxTdHJpbmcsIHttZXRob2Q6ICdPUFRJT05TJ30pLnRoZW4ocmVzcCA9PiByZXNwLnRleHQoKSlcbiAgfVxuXG59Il19
```

## SystemJS / Babel6 with only module system transformation


```JS
(function(System, SystemJS) {'use strict';

System.register(['./../external/focalStorage.js', './uuid.js'], function (_export, _context) {
  "use strict";

  var focalStorage, generateUuid;
  return {
    setters: [function (_externalFocalStorageJs) {
      focalStorage = _externalFocalStorageJs.default;
    }, function (_uuidJs) {
      generateUuid = _uuidJs.default;
    }],
    execute: function () {
      class Files {
        static fetchChunks(fetchPromise, eachChunkCB, doneCB) {
          fetchPromise.then(function (response) {
            var reader = response.body.getReader();
            var decoder = new TextDecoder();
            var all = "";
            (function read() {
              reader.read().then(function (result) {
                var text = decoder.decode(result.value || new Uint8Array(), {
                  stream: !result.done
                });
                all += text;
                if (eachChunkCB) eachChunkCB(text, result);
                if (result.done) {
                  if (doneCB) doneCB(all, result);
                } else {
                  read(); // fetch next chunk
                }
              });
            })();
          });
        }

        // #depricated, use fetch directly
        static async loadFile(url, version) {
          return fetch(url, {
            headers: {
              fileversion: version
            }
          }).then(function (response) {
            console.log("file " + url + " read.");
            return response.text();
          });
        }

        // #depricated
        static async saveFile(url, data) {
          var urlString = url.toString();
          if (urlString.match(/\/$/)) {
            return fetch(urlString, { method: 'MKCOL' });
          } else {
            return fetch(urlString, { method: 'PUT', body: data });
          }
        }

        static async statFile(urlString) {
          return fetch(urlString, { method: 'OPTIONS' }).then(resp => resp.text());
        }

      }

      _export('default', Files);
    }
  };
});
})(System, System);
//# sourceMappingURL=data:application/json;base64,eyJ2 ...snip... iXX0=
```

