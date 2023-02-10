
export function fa4(classes) {
  return '<i class="fa fa-' + classes + '" aria-hidden="true"></i>';
}

export function iconStringForFileEntry(entry) {
  const name = entry.name;
  if (entry.name.match(/\.md$/)) {
    return fa4("file-text-o")
  }
  if (entry.type == "directory") {
    return fa4("folder")
  }
  if (entry.type == "link") {
    return fa4("arrow-circle-o-right")
  }
  if (/\.html$/i.test(name)) {
    return fa4("html5")
  }
  if (/(\.|-)(spec|test)\.js$/i.test(name)) {
    return fa4("check-square-o")
  }
  if (/\.js$/i.test(name)) {
    return fa4("file-code-o")
  }
  if (/\.css$/i.test(name)) {
    return fa4("css3")
  }
  if (/\.gs$/i.test(name)) {
    return fa4("pencil-square-o")
  }
  if (/\.membrane$/i.test(name)) {
    return fa4("pencil-square")
  }
  if (/\.(png|jpg)$/i.test(name)) {
    return fa4("file-image-o")
  }
  if (/\.(pdf)$/i.test(name)) {
    return fa4("file-pdf-o")
  }
  return fa4("file-o")
}

