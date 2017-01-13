const workspaces = new Map();

export function getCode(id) {
  return workspaces.get(id);
}

export function setCode(id, src) {
  return workspaces.set(id, src);
}

