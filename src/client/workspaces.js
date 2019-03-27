
if (!self.lively4workspaces) {
  self.lively4workspaces = new Map
}
const workspaces = self.lively4workspaces

if (!self.lively4workspaceURLs) {
  self.lively4workspaceURLs = new Map
}
const workspaceURLs = self.lively4workspaceURLs



// const workspaces = new Map();
// const workspaceURLs = new Map();


export function getCode(id) {
  return workspaces.get(id);
}

export function setCode(id, src) {
  return workspaces.set(id, src);
}

export function setURL(id, url) {
  return workspaceURLs.set(id, url);
}

export function getURL(id) {
  return workspaceURLs.get(id);
}
