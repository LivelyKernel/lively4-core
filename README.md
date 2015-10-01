# lively4-core

[![Build Status](https://travis-ci.org/LivelyKernel/lively4-core.svg)](https://travis-ci.org/LivelyKernel/lively4-core)



hey ho

Core functionality for Lively4 module management


draft/test.html

http://livelykernel.github.io/lively4-core/draft/testImage.html




# Snippets

    a = $.get("https://github.lively4/repo/livelykernel/lively4-core/gh-pages/README.md")
    focalStorage.setItem("githubToken", localStorage.GithubToken)

focalStorage.getItem("githubToken").then(function(data) { log("data" + data) })


focalStorage.setItem("a", 3)
focalStorage.getItem("a").then(function(a) { console.log("a:" +a)})

$.get("https://github.lively4/repo/livelykernel/lively4-core/gh-pages/README.md",null, function(d){ log(d) })

$('#console').text("")

$('#image').attr('src', 'https://github.lively4/repo/livelykernel/lively4-core/gh-pages/media/meta.png')

System.import("authgithub.js").then(function(module) { window.githubauth = module}) 



