export function openLocationInBrowser(location) {
  const start = { line: location.start.line - 1, ch: location.start.column };
  const end = { line: location.end.line - 1, ch: location.end.column };
  lively.files.exists(location.file).then(exists => {
    if (exists) {
      lively.openBrowser(location.file, true, { start, end }, false, undefined, true);
    } else {
      lively.notify("Unable to find file:" + location.file);
    }
  });
}

export async function navigateToTimeline(timelineCallback) {
  const existingTimelines = document.body.querySelectorAll('aexpr-timeline');

  if (existingTimelines.length > 0) {
    const timeline = existingTimelines[0];
    timelineCallback(timeline);
    timeline.parentElement.focus();
    timeline.focus();
    return;
  }

  return lively.openComponentInWindow("aexpr-timeline").then(timeline => {
    timelineCallback(timeline);
  });
}
  
  
export async function navigateToGraph(aexprs, event) {
  const existingGraph = document.body.querySelectorAll('aexpr-graph');

  if(existingGraph.length > 0) {
    const graph = existingGraph[0];
    graph.setAExprs(aexprs, event);
    graph.parentElement.focus();
    graph.focus();
    return;
  }

  lively.openComponentInWindow("aexpr-graph").then((graph) => {
    graph.setAExprs(aexprs, event);
  })
}

export function toValueString(value) {
  let valueString = value && value.toString ? value.toString() : value;
  if (typeof value === 'string' || value instanceof String) {
    valueString = "\"" + valueString + "\"";
  }
  if(typeof value === "number") {
    // Max 2 digits after comma
    return +parseFloat(value).toFixed(2);
  }
  return valueString;
}

export function fileNameString(file) {
  return file.substring(file.lastIndexOf('/') + 1);
}
