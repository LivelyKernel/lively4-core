import Preferences, { AEXPR_IMPLEMENTATIONS } from 'src/client/preferences.js';

export function shouldTransform(impl, path, state) {
  if (!innerShouldTransform(impl, path, state)) {
    return false;
  }
  
  if (state.opts.enableViaDirective && !hasDirective(path, "enable aexpr")) {
    return false;
  }
  
  return true;
}

const explicitImplementationRegex = /ae(?:xpr?)?s?[ \t\f\v\r]([a-zA-Z0-9]+)/;

// #TODO: only allows for one rewriting-style implementation at a time
function innerShouldTransform(impl, path, state) {
  const inWorkspace = state.opts.executedIn === 'workspace';
  if (inWorkspace) {
    const chosenByPreference = Preferences.get('AExprImplementationForWorkspace') === impl;
    return chosenByPreference;
  }

  const inFile = state.opts.executedIn === 'file';
  if (inFile) {
    const directives = getDirectives(path)
    
    // is there an explicit directive?
    for (let directive of directives) {
      const match = directive.match(explicitImplementationRegex);
      if (match) {
        // is it my own directive?
        return match[1] === impl
      }
    }

    // const chosenByPreference = Preferences.get('AExprImplementationForFile') === impl;
    // if (!chosenByPreference) {
    //   return false
    // }

    if (state.opts.enableViaDirective) {
      return hasDirective(path, "enable aexpr")
    }
    
    return true
  }

  // always use the plugin, if in plugin explorer
  return true;
}

function getDirectives(path) {
  const directives = [];
  path.traverse({
    Directive(path) {
      directives.push(path.get("value").node.value)
    }
  });

  return directives;
}

function hasDirective(path, name) {
  let foundDirective = false;
  path.traverse({
    Directive(path) {
      if(path.get("value").node.value === name) {
        foundDirective = true;
      }
    }
  });
  return foundDirective;
}
