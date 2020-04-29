export async function p() {
  return (await import('./testing-dep.js')).p;
}
