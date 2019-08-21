
function extractUUID(thing) {
  if (!thing) { return; }

  if (thing.path) { return extractUUID(thing.path); }
  if (thing.node) { return extractUUID(thing.node); }
  if (thing.uuid) { return extractUUID(thing.uuid); }

  // already a uuid
  return thing;
}

export function nodeEqual(node1, node2) {
  const uuid1 = extractUUID(node1);
  const uuid2 = extractUUID(node2);

  return uuid1 && uuid2 && uuid1 === uuid2;
}
