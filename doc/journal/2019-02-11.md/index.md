## 2019-02-11

# Playing with #GoogleScholar


* #META: I just lost this whole journal entry while typing it on google scholar... as it seems, the browser does not work right on foreign sites....*

## Motivation

Given one paper, I want to find out how often it is cited and what is the quality if that citations. 
I can do that by using various web sites / apps,  typing in queries and following links, copy and pasting data...

I wish I could automate this....

## Problem

To automate this, one would require some service API so that one can write a program or script. But those APIs are not available or not cheaply available. But the web apps with their UI are. So many user fall back to writing scripts that scrape Web-site.... to automate their workflow. 
This can create a) expensive traffic and b) the same technology can be used to get valuable data. And the service providers have a problem with both of it. 

Idea: Why can't there be a middle ground where I can have automate my workflow with the same power I the Web app granted me....

## Approach

So lets just do this. Start with the Web-app itself and augment it with our lively explorative programming environment and see were we are going.

For the data extraction I am interested in:

- each citation
  - title
  - authors
  - googleid
  - year
  - number of citations.... here we could get recursively down....

## Implementation

- a) start with the paper (id...)
- b) retrieve all citations....
  - retrieve one page of citations
  - extract them and save them into results
- c) dump results. 
- d) extract (and dump) data
- f)_analized and visualize data



## Analysis

```javascript
var data;
(async () => {
  data = await fetch("https://lively-kernel.org/lively4/bibliography-data/scholar/citations/5934603114068816979.json").then(r => r.json())
  
  
})()


var years = new Map()

data.map(ea => ea.year).forEach(ea => {
  var year = parseInt(ea)
  years.set(year, (years.get(year) || 0) + 1)
})


Array.from(years.keys()).sort().map(ea => ea + ":" + years.get(ea)).join("\n")
```

```
1983:1
2009:9
2010:22
2011:16
2012:24
2013:24
2014:18
2015:7
2016:13
2017:8
2018:6
2019:1
NaN:13
```



