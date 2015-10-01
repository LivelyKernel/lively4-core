# lively4-core

[![Build Status](https://travis-ci.org/onsetsu/lively4-core.svg?branch=master)](https://travis-ci.org/onsetsu/lively4-core)

hey ho

Core functionality for Lively4 module management





# Snippets

    a = $.get("https://github.lively4/repo/livelykernel/lively4-core/gh-pages/README.md")
    focalStorage.setItem("githubToken", localStorage.GithubToken)

focalStorage.getItem("githubToken").then(function(data) { log("data" + data) })


focalStorage.setItem("a", 3)
focalStorage.getItem("a").then(function(a) { console.log("a:" +a)})

$.get("https://github.lively4/repo/livelykernel/lively4-core/gh-pages/README.md",null, function(d){ log(d) })

$('#console').text("")

$('#image').attr('src', 'https://github.lively4/repo/livelykernel/lively4-core/gh-pages/media/meta.png')