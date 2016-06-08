export function join(path1, path2) {
  if (path1[path1.length-1] != "/") {
    path1 += "/";
  }
  if (path2[0] == "/") {
    path2 = path2.slice(1, path2.length);
  }
  return path1 + path2;
}
