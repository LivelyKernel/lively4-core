export async function p() {
  await new Promise(function(resolve, reject) {
    console.log('waiting...');
    setTimeout(function() {
      resolve();
    }, 1000);
  })
  return 'hello world';
}