export function sortDirectoriesAndFiles(input) {
  input.sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') {
      return -1;
    } else if (a.type === 'file' && b.type === 'directory') {
      return 1;
    } else {
      return 0;
    }
  })
}

export async function optionsResult(item) {
  let url = item.path == null ? lively4url + '/' + item.name : item.path;
  let response = await fetch(url, {method: 'OPTIONS'});
  let json = await response.json();
  return json.contents;
}

export function getPath(item, parent) {
  if (parent.path != null) {
    return parent.path + '/' + item.name;
  } else {
    return lively4url + '/' + parent.name + '/' + item.name;
  }
}
  
