const api = 'http://127.0.0.1:8081'

let foo = 0
fetch(api)
  .then((response) => {
  let foo = response.json()
  return foo
  })
  .then((json) =>
       {
    let foo = json
  })




let i = 0

{
  let i = 3
}

let r = i