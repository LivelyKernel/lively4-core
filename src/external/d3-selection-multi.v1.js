import d3 from "./d3.v5.js"

function attrsFunction(selection$$1, map) {
  return selection$$1.each(function() {
    var x = map.apply(this, arguments), s = d3.select(this);
    for (var name in x) s.attr(name, x[name]);
  });
}

function attrsObject(selection$$1, map) {
  for (var name in map) selection$$1.attr(name, map[name]);
  return selection$$1;
}

var selection_attrs = function(map) {
  return (typeof map === "function" ? attrsFunction : attrsObject)(this, map);
};

function stylesFunction(selection$$1, map, priority) {
  return selection$$1.each(function() {
    var x = map.apply(this, arguments), s = d3.select(this);
    for (var name in x) s.style(name, x[name], priority);
  });
}

function stylesObject(selection$$1, map, priority) {
  for (var name in map) selection$$1.style(name, map[name], priority);
  return selection$$1;
}

var selection_styles = function(map, priority) {
  return (typeof map === "function" ? stylesFunction : stylesObject)(this, map, priority == null ? "" : priority);
};

function propertiesFunction(selection$$1, map) {
  return selection$$1.each(function() {
    var x = map.apply(this, arguments), s = d3.select(this);
    for (var name in x) s.property(name, x[name]);
  });
}

function propertiesObject(selection$$1, map) {
  for (var name in map) selection$$1.property(name, map[name]);
  return selection$$1;
}

var selection_properties = function(map) {
  return (typeof map === "function" ? propertiesFunction : propertiesObject)(this, map);
};

function attrsFunction$1(transition$$1, map) {
  return transition$$1.each(function() {
    var x = map.apply(this, arguments), t = d3.select(this).transition(transition$$1);
    for (var name in x) t.attr(name, x[name]);
  });
}

function attrsObject$1(transition$$1, map) {
  for (var name in map) transition$$1.attr(name, map[name]);
  return transition$$1;
}

var transition_attrs = function(map) {
  return (typeof map === "function" ? attrsFunction$1 : attrsObject$1)(this, map);
};

function stylesFunction$1(transition$$1, map, priority) {
  return transition$$1.each(function() {
    var x = map.apply(this, arguments), t = d3.select(this).transition(transition$$1);
    for (var name in x) t.style(name, x[name], priority);
  });
}

function stylesObject$1(transition$$1, map, priority) {
  for (var name in map) transition$$1.style(name, map[name], priority);
  return transition$$1;
}

var transition_styles = function(map, priority) {
  return (typeof map === "function" ? stylesFunction$1 : stylesObject$1)(this, map, priority == null ? "" : priority);
};

d3.selection.prototype.attrs = selection_attrs;
d3.selection.prototype.styles = selection_styles;
d3.selection.prototype.properties = selection_properties;
d3.transition.prototype.attrs = transition_attrs;
d3.transition.prototype.styles = transition_styles;

export default {}

