var id = "5934603114068816979"
var url = `https://scholar.google.de/scholar?start=0&cites=${id}&as_sdt=2005&sciodt=0,5&hl=de`
var lastURL = ""

var ensureWindowedDIV = async function(name) {
  var div = document.body.querySelector("#" + name)
  if(!div) {
    div = document.createElement("div")
    div.id = name
    div.style.overflow = "scroll"
    
    var w = await lively.create("lively-window")
    w.appendChild(div)
    lively.setPosition(w, lively.pt(0,100))
    lively.setExtent(w, lively.pt(1000,1000))
    div.style.zIndex = 100
  }
  return div
}
  
var dumpResults = async function(){
  var dumpBase = "https://lively-kernel.org/lively4/bibliography-data/scholar/citations/";
  var result = (await ensureWindowedDIV("resultDiv"))
  var dumpURL = dumpBase  + id + ".html"
  await fetch(dumpURL, {
    method: "PUT",
    body: result.innerHTML
  })
  lively.notify("dumped " + result.childNodes.length + "entries to " + dumpURL)
}


var extractData = async function() {
  var data = []
  var result = (await ensureWindowedDIV("resultDiv"))
  Array.from(result.querySelectorAll(".gs_ri")).forEach(ea => {
    var titleEntry = ea.querySelector("h3")
    var gs_a = ea.querySelector(".gs_a")
    var citationsEntry = Array.from(ea.querySelectorAll("a")).find(eaA => {
      var href = eaA.getAttribute("href")
      return href && href.match(/\/scholar\?cites=/)
    }) 
    var key = citationsEntry && citationsEntry.href.replace(/.*\/scholar\?cites=([0-9]+).*/,"$1")
    var gs_a_text = gs_a ? gs_a.textContent : "";
    var entry = {
      title: titleEntry && titleEntry.textContent,
      key: key,
      year: gs_a && gs_a.textContent.replace(/.*([0-9][0-9][0-9][0-9]).*/, "$1"), // last 4digit number ?
      authors: gs_a && Array.from(gs_a.querySelectorAll("a")).map(eaAuthor => {
        gs_a_text = gs_a_text.replace(eaAuthor.textContent,"") // find the rest of authors line
        return {
          shortname: eaAuthor.textContent,
          user: eaAuthor.href && eaAuthor.href.replace(/.*user=/,"").replace(/&.*/,"")
        }}),
      publisher: gs_a_text.replace(/^[^A-Za-z0-9]*/,""), // the rest
      citations: citationsEntry && citationsEntry.textContent.replace(/.*([0-9]+).*/, "$1") // any number
    }
    data.push(entry)
    
  })
  return data
}

var dumpData = async function(){
  var dumpBase = "https://lively-kernel.org/lively4/bibliography-data/scholar/citations/";
  var result = (await ensureWindowedDIV("resultDiv"))
  var dataURL = dumpBase  + id + ".json"
  var data = await extractData()
  await fetch(dataURL, {
    method: "PUT",
    body: JSON.stringify(data)
  })
  lively.notify("dumped data " +  dataURL)
}


var previewURL = async function(url) {
  var src = await fetch(url).then(r => r.text());  
  (await ensureWindowedDIV("previewDiv")).innerHTML = src
  
}

var extractResults = async function(){
  var preview = (await ensureWindowedDIV("previewDiv"))
  var result = (await ensureWindowedDIV("resultDiv"))
  
  Array.from(preview.querySelectorAll(".gs_ri")).forEach(ea => {
    result.appendChild(ea)
  })
}

var followNextPage = async function(){
  var url = await findNextLink()
  if (!url || url == lastURL) {
    lively.notify("finished...")
    return false
  }
  lastURL = url
  previewURL(url)
  return true
}


var findNextLink = async function() {
  var preview = (await ensureWindowedDIV("previewDiv"))
  var nextButtonIcon = preview.querySelector(".gs_ico_nav_next")
  return  nextButtonIcon && nextButtonIcon.parentElement.href 
}

var scrapCitations = async function() {
  await previewURL(url) // start it
  await extractResults()
  await lively.sleep(1000);
  (async () => {
    while(await followNextPage()) {
      await lively.sleep(1000) 
      await extractResults()  
    } // repeat until finished
  })()  
}




/*

previewURL(url) // start it
extractResults()

followNextPage() // repeat until finished
extractResults()

scrapCitations()


dumpResults() // and store it somewhere to be usefull

dumpData()

result.childNodes.length

*/

// debug
var preview, result;
(async function(){
  preview = (await ensureWindowedDIV("previewDiv"))
  result = (await ensureWindowedDIV("resultDiv"))
  
})()

