## Markus' Fetch Issue

Markus noticed some serius lag when using Lively4, that occurred randomly but often, e.g. when sending a PUT request.

Here is the log of a delay that took nearly 2 minutes:

```
boot.js:35 [boot]  629 2021-06-28T12:02:13.798Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

// ... things happened

boot.js:35 [boot]  629 2021-06-28T12:04:10.212Z  116415.00ms finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
```

### Full Log

```
boot.js:35 [boot]  629 2021-06-28T12:02:13.798Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
  
  // ??? Service Worker gets (re-)started? Maybe this is the problem
  service-worker.js:20 [swx]  0 2021-06-28T12:02:13.828Z  NaNms  NEW SERVICE Worker ServiceWorkerGlobalScope
    service-worker.js:20 [swx]  0 2021-06-28T12:02:13.829Z  0.30ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
    
    // so... it passes it on to the server
    service-worker.js:20 [swx]  0 2021-06-28T12:02:13.829Z  0.40ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js


// ??? and the client fetches it again?
boot.js:35 [boot]  630 2021-06-28T12:02:20.679Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
    
    
    
    service-worker.js:20 [swx]  1 2021-06-28T12:02:20.682Z  0.00ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
    service-worker.js:20 [swx]  1 2021-06-28T12:02:20.682Z  0.30ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
    service-worker.js:20 [swx]  2 2021-06-28T12:02:24.503Z  0.00ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/start.html?load=https://lively-kernel.org/lively4/lively4-markus/README.md
    service-worker.js:20 [swx]  2 2021-06-28T12:02:24.509Z  6.80ms   SWX fallback... fetch again: https://lively-kernel.org/lively4/lively4-markus/start.html?load=https://lively-kernel.org/lively4/lively4-markus/README.md
    service-worker.js:20 [swx]  3 2021-06-28T12:02:24.512Z  0.10ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/templates/lively4.css
    service-worker.js:20 [swx]  4 2021-06-28T12:02:24.513Z  0.10ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/external/font-awesome/css/font-awesome.min.css
    service-worker.js:20 [swx]  5 2021-06-28T12:02:24.513Z  0.10ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/client/lively.css
    service-worker.js:20 [swx]  6 2021-06-28T12:02:24.514Z  0.00ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/external/code-mirror/addon/hint/show-hint.css
    service-worker.js:20 [swx]  7 2021-06-28T12:02:24.514Z  0.00ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/external/code-mirror/addon/lint/lint.css
    service-worker.js:20 [swx]  8 2021-06-28T12:02:24.514Z  0.00ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/components/widgets/lively-code-mirror.css
    service-worker.js:20 [swx]  3 2021-06-28T12:02:24.519Z  6.90ms   SWX fallback... fetch again: https://lively-kernel.org/lively4/lively4-markus/templates/lively4.css
    service-worker.js:20 [swx]  4 2021-06-28T12:02:24.522Z  9.00ms   SWX fallback... fetch again: https://lively-kernel.org/lively4/lively4-markus/src/external/font-awesome/css/font-awesome.min.css
    service-worker.js:20 [swx]  5 2021-06-28T12:02:24.522Z  9.20ms   SWX fallback... fetch again: https://lively-kernel.org/lively4/lively4-markus/src/client/lively.css
    service-worker.js:20 [swx]  6 2021-06-28T12:02:24.523Z  9.40ms   SWX fallback... fetch again: https://lively-kernel.org/lively4/lively4-markus/src/external/code-mirror/addon/hint/show-hint.css
    service-worker.js:20 [swx]  7 2021-06-28T12:02:24.523Z  9.60ms   SWX fallback... fetch again: https://lively-kernel.org/lively4/lively4-markus/src/external/code-mirror/addon/lint/lint.css
    service-worker.js:20 [swx]  8 2021-06-28T12:02:24.524Z  9.90ms   SWX fallback... fetch again: https://lively-kernel.org/lively4/lively4-markus/src/components/widgets/lively-code-mirror.css
    9143 log entries are not shown.
    Fehler beim Laden der Quell Zuordnung durch devtools: Der Inhalt für https://lively-kernel.org/lively4/lively4-markus/src/external/dexie.js.map konnte nicht geladen werden: HTTP Fehler: Statuscode 404,net::ERR_HTTP_RESPONSE_CODE_FAILURE
    Fehler beim Laden der Quell Zuordnung durch devtools: Der Inhalt für https://lively-kernel.org/lively4/lively4-markus/src/external/d3-graphviz.js.map konnte nicht geladen werden: HTTP Fehler: Statuscode 404,net::ERR_HTTP_RESPONSE_CODE_FAILURE

boot.js:35 [boot]  630 2021-06-28T12:02:40.841Z  20162.20ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
boot.js:35 [boot]  631 2021-06-28T12:02:40.844Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

fetch.js:249 AuthorizedFetch Write: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
fetch.js:212 Ensure Github Credentials: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

service-worker.js:20 [swx]  9 2021-06-28T12:02:40.849Z  0.00ms  fetch PUT https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
service-worker.js:20 [swx]  9 2021-06-28T12:02:40.849Z  0.50ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

fileindex.js:768 [fileindex] updateFile https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

boot.js:35 [boot]  631 2021-06-28T12:03:01.878Z  21033.70ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

service-worker.js:20 [swx]  10 2021-06-28T12:03:01.879Z  0.00ms  fetch OPTIONS https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
service-worker.js:20 [swx]  10 2021-06-28T12:03:01.880Z  0.90ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

  lively.js:504 Lively Notification {title: "saved file", text: URL}
  lively-editor.js:319 updateEditors
  updateOtherEditors @ lively-editor.js:319
  saveFile @ lively-editor.js:668
  async function (async)
  saveFile @ lively-editor.js:648

    boot.js:35 [boot]  632 2021-06-28T12:03:01.892Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/components/halo/
    service-worker.js:20 [swx]  11 2021-06-28T12:03:01.895Z  0.00ms  fetch OPTIONS https://lively-kernel.org/lively4/lively4-markus/src/components/halo/
    service-worker.js:20 [swx]  11 2021-06-28T12:03:01.896Z  0.30ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/components/halo/

fileindex.js:791 [fileindex] addFile https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

service-worker.js:20 [swx]  12 2021-06-28T12:03:01.940Z  0.10ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
service-worker.js:20 [swx]  12 2021-06-28T12:03:01.941Z  0.70ms   SWX fallback... fetch again: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

    boot.js:35 [boot]  632 2021-06-28T12:03:01.972Z  79.50ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/components/halo/
    boot.js:35 [boot]  633 2021-06-28T12:03:01.973Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/components/demo/
    service-worker.js:20 [swx]  13 2021-06-28T12:03:01.974Z  0.00ms  fetch OPTIONS https://lively-kernel.org/lively4/lively4-markus/src/components/demo/
    service-worker.js:20 [swx]  13 2021-06-28T12:03:01.974Z  0.20ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/components/demo/
    boot.js:35 [boot]  633 2021-06-28T12:03:02.010Z  37.70ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/components/demo/
    boot.js:35 [boot]  634 2021-06-28T12:03:02.011Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/components/draft/
    service-worker.js:20 [swx]  14 2021-06-28T12:03:02.012Z  0.00ms  fetch OPTIONS https://lively-kernel.org/lively4/lively4-markus/src/components/draft/
    service-worker.js:20 [swx]  14 2021-06-28T12:03:02.012Z  0.30ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/components/draft/
    boot.js:35 [boot]  634 2021-06-28T12:03:02.047Z  36.20ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/components/draft/
    boot.js:35 [boot]  635 2021-06-28T12:03:02.048Z  0.10ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/components/d3/
    service-worker.js:20 [swx]  15 2021-06-28T12:03:02.049Z  0.00ms  fetch OPTIONS https://lively-kernel.org/lively4/lively4-markus/src/components/d3/
    service-worker.js:20 [swx]  15 2021-06-28T12:03:02.049Z  0.00ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/components/d3/
    boot.js:35 [boot]  635 2021-06-28T12:03:02.089Z  41.00ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/components/d3/
    boot.js:35 [boot]  636 2021-06-28T12:03:02.090Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/vivide/components/
    service-worker.js:20 [swx]  16 2021-06-28T12:03:02.091Z  0.00ms  fetch OPTIONS https://lively-kernel.org/lively4/lively4-markus/src/client/vivide/components/
    service-worker.js:20 [swx]  16 2021-06-28T12:03:02.091Z  0.10ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/vivide/components/
    boot.js:35 [boot]  636 2021-06-28T12:03:02.126Z  36.60ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/vivide/components/
    boot.js:35 [boot]  637 2021-06-28T12:03:02.127Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/rewritten/
    service-worker.js:20 [swx]  17 2021-06-28T12:03:02.128Z  0.10ms  fetch OPTIONS https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/rewritten/
    service-worker.js:20 [swx]  17 2021-06-28T12:03:02.128Z  0.20ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/rewritten/
    boot.js:35 [boot]  637 2021-06-28T12:03:02.173Z  46.30ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/rewritten/
    boot.js:35 [boot]  638 2021-06-28T12:03:02.173Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/
    service-worker.js:20 [swx]  18 2021-06-28T12:03:02.175Z  0.10ms  fetch OPTIONS https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/
    service-worker.js:20 [swx]  18 2021-06-28T12:03:02.175Z  0.30ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/
    boot.js:35 [boot]  638 2021-06-28T12:03:02.212Z  38.70ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/
    boot.js:35 [boot]  639 2021-06-28T12:03:02.213Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/
    service-worker.js:20 [swx]  19 2021-06-28T12:03:02.214Z  0.00ms  fetch OPTIONS https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/
    service-worker.js:20 [swx]  19 2021-06-28T12:03:02.214Z  0.20ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/
    boot.js:35 [boot]  639 2021-06-28T12:03:02.250Z  37.30ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/

??    lively.js:504 Lively Notification {title: "update template", text: undefined}
    lively-container.js:2512 updateOtherContainers
    updateOtherContainers @ lively-container.js:2512

  onSave @ lively-container.js:1644
  async function (async)
  onSave @ lively-container.js:1624

boot.js:35 [boot]  640 2021-06-28T12:03:02.258Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
service-worker.js:20 [swx]  20 2021-06-28T12:03:02.260Z  0.00ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
service-worker.js:20 [swx]  20 2021-06-28T12:03:02.260Z  0.10ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

boot.js:35 [boot]  640 2021-06-28T12:03:22.398Z  20139.60ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js


boot.js:83 [babel] update transpilation cache https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
  boot.js:90 [lively4transpilationCache] ignore src_client_reactive_components_basic_aexpr-graph_identifier-node.js

    boot.js:35 [boot]  641 2021-06-28T12:03:22.498Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.js
    service-worker.js:20 [swx]  21 2021-06-28T12:03:22.500Z  0.10ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.js
    service-worker.js:20 [swx]  21 2021-06-28T12:03:22.500Z  0.30ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.js
    boot.js:35 [boot]  641 2021-06-28T12:03:22.555Z  56.50ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.js

  lively.js:694 update template prototype: //lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
  lively.js:700 [templates] update template https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.html

    lively.js:694 update template prototype: //lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.js
    lively.js:700 [templates] update template https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.html
  lively.js:504 Lively Notification {title: "", text: "Module https://lively-kernel.org/lively4/lively4-m…ts/basic/aexpr-graph/identifier-node.js reloaded!"}
    lively-container.js:1659 START DEP TEST RUN
    lively-container.js:1665 END DEP TEST RUN

fileindex.js:816 [fileindex] load versions for https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
fileindex.js:866 [fileindex] addFile https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js FINISHED (20751ms)

    boot.js:35 [boot]  642 2021-06-28T12:03:22.691Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.html
    service-worker.js:20 [swx]  22 2021-06-28T12:03:22.692Z  0.00ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.html
    boot.js:35 [boot]  643 2021-06-28T12:03:22.692Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.html
    service-worker.js:20 [swx]  22 2021-06-28T12:03:22.692Z  0.20ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.html
    systemjs-worker.js:35 new onmessage
    service-worker.js:20 [swx]  23 2021-06-28T12:03:22.694Z  0.10ms  fetch GET https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.html
    service-worker.js:20 [swx]  23 2021-06-28T12:03:22.695Z  0.20ms   SWX let it go through: https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.html
    boot.js:256 GET https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.html 404 (Not Found)
    result @ boot.js:256
    self.fetch @ boot.js:238
    loadFileResponse @ files.js:145
    loadFile @ files.js:153
    eval @ lively.js:702
    setTimeout (async)
    reloadModule @ lively.js:701
    async function (async)
    reloadModule @ lively.js:616
    loadModule @ lively-container.js:1059
    onSave @ lively-container.js:1658
    async function (async)
    onSave @ lively-container.js:1624
    boot.js:35 [boot]  642 2021-06-28T12:03:22.738Z  47.70ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.html
    files.js:154 file https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.html read.
    boot.js:35 [boot]  643 2021-06-28T12:03:22.820Z  128.40ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.html
    files.js:154 file https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/aexpr-graph.html read.
    boot.js:35 [boot]  644 2021-06-28T12:03:22.822Z  0.00ms  fetch  cached:https://lively-kernel.org/lively4/lively4-markus/src/external/font-awesome/css/font-awesome.css
    boot.js:35 [boot]  645 2021-06-28T12:03:22.823Z  0.00ms  fetch  cached:https://lively-kernel.org/lively4/lively4-markus/templates/livelystyle.css
    boot.js:35 [boot]  646 2021-06-28T12:03:22.824Z  0.00ms  fetch  cached:https://lively-kernel.org/lively4/lively4-markus/src/external/jstree/themes/default/style.css
    boot.js:35 [boot]  644 2021-06-28T12:03:22.825Z  3.00ms  finished fetch  cached:https://lively-kernel.org/lively4/lively4-markus/src/external/font-awesome/css/font-awesome.css
    boot.js:35 [boot]  645 2021-06-28T12:03:22.826Z  2.50ms  finished fetch  cached:https://lively-kernel.org/lively4/lively4-markus/templates/livelystyle.css
    boot.js:35 [boot]  646 2021-06-28T12:03:22.826Z  2.30ms  finished fetch  cached:https://lively-kernel.org/lively4/lively4-markus/src/external/jstree/themes/default/style.css

// and here is a 30second pause

boot.js:35 [boot]  629 2021-06-28T12:04:10.212Z  116415.00ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js
boot.js:35 [boot]  647 2021-06-28T12:04:10.214Z  0.00ms  fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/identifier-node.js

```