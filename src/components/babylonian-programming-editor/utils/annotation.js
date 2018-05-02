export default function makeAnnotation(values, indent, isReplacement) {
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
