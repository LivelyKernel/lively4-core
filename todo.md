#TODOs 

<lively-script><script>
(async () => {
  return hello
  var ul = document.createElement("ul")
  var files = await FileCache.current().db.files.filter(ea => ea.tags.indexOf("#TODO") != -1).toArray();
  file.forEach(ea => {
    ea.content.split("\n").filter(ea => ea.match(/#TODO/).forEach(line => {
      var li = document.createElement("li")
      li.innerHTML = `<a href="${ea.url}>${ea.name} ${line}</a>)}`
      li.querySelctor("a").onclick = (evt) +> {
        evt.preventDefault()
        lively.openBrowser(ea.url, line)
      }
    })
  })))
  })
  return ul
})()
</script></lively-script>