var fs = require("fs");
var lang = require("./index.js");
var ast = require("lively.ast");

var obj = lang.obj;
var arr = lang.arr;
var fun = lang.fun;
var string = lang.string;

var showMissingDocs = true;
var projectPath = "./";
var dryRun = false;

var interface = {
  Closure: ["fromFunction","fromSource"],
  "Closure.prototype": ["isLivelyClosure","doNotSerialize","initialize","setFuncSource","getFuncSource","hasFuncSource","getFunc","getFuncProperties","setFuncProperties","lookup","parameterNames","firstParameter","recreateFunc","recreateFuncFromSource","addFuncProperties","couldNotCreateFunc","asFunction","addClosureInformation"],
  Path: ["superclass","type","categories"],
  "Path.prototype": ["isPathAccessor","splitter","fromPath","setSplitter","parts","size","slice","normalizePath","isRoot","isIn","equals","isParentPathOf","relativePathTo","set","get","concat","toString","serializeExpr","watch","debugFunctionWrapper"],
  arr: ["isArray","range","from","withN","genN","sort","filter","forEach","some","every","map","reduce","reduceRight","each","all","any","collect","findAll","detect","filterByKey","grep","reMatches","include","inject","invoke","max","min","partition","pluck","reject","rejectByKey","sortBy","sortByKey","toArray","zip","clear","first","last","compact","mutableCompact","flatten","without","withoutAll","uniq","uniqBy","equals","intersect","union","clone","pushAt","removeAt","remove","pushAll","pushAllAt","pushIfNotIncluded","replaceAt","nestedDelay","doAndContinue","forEachShowingProgress","sum","swap","rotate","groupBy","groupByKey","batchify","mask","toTuples","shuffle","histogram"],
  arrNative: ["sort","filter","forEach","some","every","map","reduce","reduceRight"],
  arrayProjection: ["create","toArray","originalToProjectedIndex","projectedToOriginalIndex","transformToIncludeIndex"],
  date: ["format","equals","relativeTo"],
  events: ["makeEmitter"],
  fun: ["Empty","K","Null","False","True","all","own","argumentNames","qualifiedMethodName","extractBody","timeToRun","timeToRunN","delay","throttle","debounce","throttleNamed","debounceNamed","createQueue","workerWithCallbackQueue","composeAsync","compose","flip","waitFor","waitForAll","curry","wrap","getOriginal","once","fromString","asScript","asScriptOf","addToObject","binds","setLocalVarValue","getVarMapping","_queues","_debouncedByName","_throttledByName","_queueUntilCallbacks"],
  grid: ["create","mapCreate","forEach","map","toObjects","tableFromObjects","benchmark"],
  Group: ["by","fromArray"],
  "Group.prototype": ["toArray","forEach","forEachGroup","map","mapGroups","keys","reduceGroups","count"],
  interval: ["isInterval","compare","sort","coalesce","coalesceOverlapping","mergeOverlapping","intervalsInRangeDo","intervalsInbetween","mapToMatchingIndexes","benchmark"],
  messenger: ["OFFLINE","ONLINE","CONNECTING","create"],
  num: ["random","normalRandom","humanReadableByteSize","average","median","between","sort","parseLength","convertLength","roundTo","detent","toDegrees","toRadians"],
  obj: ["isArray","isElement","isFunction","isBoolean","isString","isNumber","isUndefined","isRegExp","isObject","isEmpty","keys","values","extend","clone","inspect","merge","inherit","valuesInPropertyHierarchy","mergePropertyInHierarchy","deepCopy","typeStringOf","shortPrintStringOf","isMutableType","safeToString","foo"],
  properties: ["all","allOwnPropertiesOrFunctions","own","forEachOwn","nameFor","values","ownValues","any","allProperties","hash"],
  string: ["format","formatFromArray","withDecimalPrecision","indent","removeSurroundingWhitespaces","print","lines","paragraphs","nonEmptyLines","tokens","printNested","camelCaseString","tableize","pad","printTable","printTree","newUUID","unescapeCharacterEntities","createDataURI","quote","md5","reMatches","stringMatch","peekRight","peekLeft","lineIndexComputer","diff","empty","blank","include","startsWith","startsWithVowel","endsWith","truncate","regExpEscape","strip","camelize","capitalize","toQueryParams","toArray","succ","times","hashCode"],
  worker: ["fork","create"]
}

if (require.main === module) {
  generateDoc();
} else {
  exports.generateDoc = generateDoc;
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function generateDoc(thenDo) {
  var commentData = {};

  var files = [
    "lib/class.js",
    "lib/collection.js",
    "lib/date.js",
    "lib/events.js",
    "lib/function.js",
    "lib/graph.js",
    "lib/messenger.js",
    "lib/number.js",
    "lib/object.js",
    "lib/string.js",
    "lib/tree.js",
    "lib/worker.js"
    ];

  // var files = ["lib/function.js"];

  global.fileData = {};
  fun.composeAsync(
      step1_readSourceFiles.bind(global,files),
      step2_extractCommentsFromFileData,
      step3_markdownFromFileData,
      step4_commentCoverageFromFileData,
      step5_markdownTocFromFileData,
      step6_markdownDocumentationFromFileData,
      step7_markdownDocFilesFromFileData,
      step8_markdownTocFromFileData
  )(function(err, markup, fileData) {
      if (err) console.error(String(err));
      else console.log("DONE!");
    
      if (!showMissingDocs) {
        console.log(
          missingComments(
            interface,
            obj.merge(obj.values(fileData).pluck('coverage').compact())));
      }
    
      // this.updateMarkdownPreview(markup);
      thenDo && thenDo(err);
  });

}

function readFile(name, thenDo) {
  fs.readFile(name, function(err, out) { thenDo(err, out && String(out)); });
}

function writeFile(name, content, thenDo) {
  if (dryRun) {
    console.log("WRITING %s\n%s", name, content);
    thenDo(null);
  } else {
    fs.writeFile(name, content, thenDo);
  }
}

function processComment(comments, comment) {
  if (ignoreComment(comment)) return comments;
  removePublicDecl(comment);
  // markTypes(comment);
  ignoreTypes(comment);
  markExamples(comment);
  comments.push(comment)
  return comments; 

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  function markTypes(comment) {
    var text = comment.comment;
    // var text = " [a] -> (a -> Boolean) -> c? -> a "
    var matches = string.reMatches(text, /^[ [\[\]\(\)a-z\?\*\+]+(?:->[ [\[\]\(\)a-z\?\*\+]+)+$/igm);
    var match = matches && matches[0];
    if (!match) return comment;
    var before = text.slice(0, match.start);
    var inner = matches[0].match.replace(/^(\s*)|(\s*)$$/g,'$1`');
    var after = text.slice(match.end);
    comment.comment = before + inner + after;
    return comment;
  }

  function ignoreTypes(comment) {
    var text = comment.comment;
    // var text = " [a] -> (a -> Boolean) -> c? -> a "
    var matches = string.reMatches(text, /^[ [\[\]\(\)a-z\?\*\+]+(?:->[ [\[\]\(\)a-z\?\*\+]+)+$/igm);
    var match = matches && matches[0];
    if (!match) return comment;
    var before = text.slice(0, match.start);
    var after = text.slice(match.end);
    comment.comment = before + after;
    return comment;
  }

  function markExamples(comment) {
    var text = comment.comment;
    var matches = string.reMatches(text, /Examples?:\s*/)
    var match = matches && matches[0];
    if (!match) return comment;
    var before = text.slice(0, match.start);
    var code = text.slice(match.end);
    code = "\n" + code.replace(/^\s/gm, "");
    comment.comment = before
                    + "\n\n```js"
                    + code
                    + "\n```"
    return comment;
  }

  function removePublicDecl(comment) {
    if (comment.comment.trim() === 'show-in-doc') comment.comment = ""
    return comment
  }
  
  function ignoreComment(comment) {
    if (string.startsWith(comment.comment.trim(), 'ignore-in-doc')) return true;
    if (!comment.name) return true;
    if (comment.type !== "method") return false;
    // aloow only one comment (the first one) per method
    return comments.some(function(c) {
        return c.name == comment.name && c.objectName == comment.objectName;
    });
  }
}

function step1_readSourceFiles(files, thenDo) {
  var fileData = {};
  console.log("loading...");
  arr.doAndContinue(files, function(next, fn, i) {
    console.log("...%s/%s", i, files.length);
    readFile(fn, function(err, out) {
      fileData[fn] = {content: out};
      next();
    });
  }, function() { thenDo(null, fileData); });
}


function step2_extractCommentsFromFileData(fileData, thenDo) {
  Object.keys(fileData).forEach(function(fn) {
    try {
      var comments = ast.comments.extractComments(fileData[fn].content);
      fileData[fn].comments = comments.reduce(processComment, []);
      var topLevelComment = arr.detect(comments, function(ea) { return !string.startsWith(ea.comment, "global") && !ea.path.length; });
      fileData[fn].topLevelComment = (topLevelComment ? topLevelComment.comment : "").replace(/^\s+(\*\s+)?/gm, "");

    } catch (err) {
      console.error("error extracting comments in file "
           + fn + ":\n" + (err.stack || err))
    }
  });
  thenDo(null, fileData);
}



function step3_markdownFromFileData(fileData, thenDo) {
  Object.keys(fileData).forEach(function(fn) {
    if (fileData[fn].comments)
      fileData[fn].markdown = markdownFromComments(fn, fileData[fn].comments);
  });
  thenDo(null, fileData);
  
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  
  function markdownFromComments(fileName, comments) {
    return arr.compact(comments.map(function(ea) {
       if (ea.comment.trim().match(/^[-=-]+$/)) return null;
       switch (ea.type) {
         case 'object': case 'var': {
           return string.format('### %s%s\n\n%s', anchorFor(ea), ea.name, ea.comment);
         }
         case 'method': {
           var objName = string.endsWith(ea.objectName, ".prototype") ? ea.objectName.replace(".prototype", ">>") : ea.objectName + ".";
           return string.format('#### %s%s%s(%s)\n\n%s', anchorFor(ea), objName, ea.name, ea.args.join(', '), ea.comment);
        }
        case 'function': {
          if (!ea.name.match(/^[A-Z]/)) return null;
          return string.format('#### %s%s(%s)\n\n%s', anchorFor(ea), ea.name, ea.args.join(', '), ea.comment);
        }
         default: return null;
       }
     })).join('\n\n');
  }

  function anchorFor(comment) {
    return string.format('<a name="%s%s"></a>',
      comment.objectName ? comment.objectName + "-" : "",
      comment.name);
  }
}



function step4_commentCoverageFromFileData(fileData, thenDo) {
  Object.keys(fileData).forEach(function(fn) {
    fileData[fn].coverage = coverageFromComments(fn, fileData[fn].comments);
  });
  thenDo(null, fileData);
  
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  
  function coverageFromComments(fileName, comments) {
    var coverage = {};
    comments.map(function(ea) {
      if (ea.comment.trim().match(/^[-=-]+$/)) return null;
      switch (ea.type) {
        case 'object': case 'var': {
          if (!coverage[ea.name]) coverage[ea.name] = [];
          return;
        }
        case 'method': {
          if (!coverage[ea.objectName]) coverage[ea.objectName] = [];
          coverage[ea.objectName].push(ea.name);
          return;
        }
        case 'function': {
          if (!ea.name.match(/^[A-Z]/)) return null;
          if (!coverage[ea.name]) coverage[ea.name] = [];
          return;
        }
        default: return null;
      }
    });
  
    return coverage;
  }

}



function step5_markdownTocFromFileData(fileData, thenDo) {
  Object.keys(fileData).forEach(function(fn) {
    if (fileData[fn].coverage)
      fileData[fn].markdownToc = printKeysWithLists(fileData[fn].coverage);
  });
  thenDo(null, fileData);
  
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function printKeysWithLists(obj) {
    return Object.keys(obj)
        .map(function(k) {
          var objHeading = "- [" + k + "](#" + k + ")";
          if (!arr.uniq(obj[k]).length) return objHeading;
          return objHeading + "\n  - "+ arr.uniq(obj[k])
                 .map(function(item) { return "[" + item + "](#" + (k + "-" + item) + ")"})
                 .join("\n  - ");
         }).join("\n");
  }

}

function step6_markdownDocumentationFromFileData(fileData, thenDo) {
  var markupToc = "### Contents\n\n"
                + lang.chain(fileData).values().pluck('markdownToc')
                    .invoke("trim").compact().value().join("\n\n");

  var markup = markupToc + "\n\n"
    + lang.chain(fileData).values().pluck('markdown').value().join('\n\n')

  thenDo(null, markup, fileData)
}



function step7_markdownDocFilesFromFileData(markup, fileData, thenDo) {

  console.log("writing...");

  var sourceFiles = Object.keys(fileData);

  arr.doAndContinue(sourceFiles, function(next, fn, i) {
    console.log("...%s/%s", i, sourceFiles.length);
    var docFile = fn.replace(/lib\//, 'doc/').replace(/\.js$/, '.md');
    var content = "## " + fn + "\n\n" + fileData[fn].topLevelComment + "\n\n"
      + (fileData[fn].markdownToc || "*no toc!*") + "\n\n" + fileData[fn].markdown;

    writeFile(docFile, content, function(err) { next(err); });
  }, function() { thenDo(null, markup, fileData); });

}



function step8_markdownTocFromFileData(markup, fileData, thenDo) {
  var startMarker = "<!---API_GENERATED_START--->";
  var endMarker = "<!---API_GENERATED_END--->";

  putOutlineIntoReadme();
  // putEntireDocIntoReadme();

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function putOutlineIntoReadme() {
    var content = [];
    Object.keys(fileData).forEach(function(fn) {
      var s = string.format(
        "### [%s](doc/%s)\n\n%s\n\n",
        fn.replace(/^lib\//, ""), fn.replace(/\.js$/, ".md").replace(/^lib\//, ""),
        fileData[fn].topLevelComment);
      content.push(s);
    });
    updateReadme(content.join("\n\n"));
  }

  function putEntireDocIntoReadme() { updateReadme(markup); }

  function updateReadme(content) {
    fun.composeAsync(
      function(next) { readFile("README.md", next); },
      function(readmeContent, next) {
        var startIdx = readmeContent.indexOf(startMarker) + startMarker.length;
        var endIdx = readmeContent.indexOf(endMarker);
        var start = readmeContent.slice(0, startIdx);
        var end = readmeContent.slice(endIdx);
        next(null, start + "\n" + content + "\n" + end);
      },
      function(updatedReadmeContent, next) {
        writeFile("README.md", updatedReadmeContent, function(err) { next(err); });
      }
    )(function(err) { thenDo(err, markup, fileData) });
  }
}



function missingComments(jsExtInterface, commented) {
  var commentsAdded = {};
  var commentsMissing = {};
  var numberOfAllItems = 0;
  var numberOfCommentedItems = 0

  Object.keys(jsExtInterface).forEach(function(k) {
      jsExtInterface[k].forEach(function(ea) {
          numberOfAllItems++;
          if (commented[k] && commented[k].include(ea)) {
              numberOfCommentedItems++;
            if (!commentsAdded[k]) commentsAdded[k] = [];
            commentsAdded[k].push(ea);
          } else {
            if (!commentsMissing[k]) commentsMissing[k] = [];
            commentsMissing[k].push(ea);
          }
          
          if (commented[k]) commented[k].remove(ea);
      });
  });

  var nonInterfaceComments = {};
  Object.keys(commented).forEach(function(k) {
    commented[k].forEach(function(ea) {
      if (!nonInterfaceComments[k]) nonInterfaceComments[k] = [];
      nonInterfaceComments[k].push(ea);
    });
  });
  
  var string = "progress: " + numberOfAllItems + "/" + numberOfCommentedItems + "\n\n"
             + ">>>>> commented:\n\n" + printKeysWithLists(commentsAdded)
             + "\n\n-=-=-=-=-=-=-\n\n"
             + ">>>>> not commented:\n\n" + printKeysWithLists(commentsMissing)
             + "\n\n-=-=-=-=-=-=-\n\n"
             + ">>>>> commented non-interface:\n\n" + printKeysWithLists(nonInterfaceComments)

  return string;

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  
  function printKeysWithLists(obj) {
    return Object.keys(obj)
        .map(function(k) {
          return k + "\n  " + obj[k].uniq().join("\n  "); })
        .join("\n\n");
  }
}
