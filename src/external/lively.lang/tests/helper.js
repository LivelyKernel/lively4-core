function loadUncached(urls, thenDo) {
  if (!urls.length) { thenDo && thenDo(); return; }
  var url = urls.shift();

  if (typeof babel !== "undefined") {
    babel.load(url, function() { loadUncached(urls, thenDo); })
  } else {
    loadViaScript(url, urls, thenDo)
  }
}

function loadViaScript(url, urls, thenDo) {
  var script = document.createElement('script');
  script.src = url + (url.indexOf('?') > -1 ? '&' : '?' + Date.now());
  script.type = "application/javascript";
  document.head.appendChild(script);
  script.addEventListener('load', function() { loadUncached(urls, thenDo); });
}
