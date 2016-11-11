export async function p() {
  return await new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve('Rocks :)');
    }, 0);
  });
}
