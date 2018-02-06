for (let index = 0; index < 100; index++) {
  console.info(index)
}


const alphabet = {first: 'a', second: 'b', third: 'c'}

for (const key in alphabet) {
  if (!alphabet.hasOwnProperty(key)) continue
  console.info(key, '=>', alphabet[key])
}


for (const value of [1, 2, 3]) {
  console.info(value)
}