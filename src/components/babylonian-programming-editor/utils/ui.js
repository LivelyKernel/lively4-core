/**
 * Adds a new marker to the editor
 */
export const addMarker = (editor, loc, classNames) => {
  const marker = editor.markText(
    loc.from,
    loc.to,
    {
      className: `marker ${classNames.join(" ")}`,
      startStyle: "start",
      endStyle: "end",
      inclusiveLeft: true,
      inclusiveRight: true
    }
  );
  marker._babylonian = true;
  return marker;
}

/**
 * Generates a new annotation
 */
export const makeAnnotation = (values, indent, isReplacement) => {
  const element = document.createElement("span");
  element.classList.add("annotation");
  if(isReplacement) {
    element.classList.add("replacement");
  }

  const arrow = isReplacement ? "↖︎" : "↘︎";
  element.textContent = `${arrow} ${values.map((e)=>e[1]).join(" | ")}`;
  element.style.left = `${indent}ch`;

  return element;
}
