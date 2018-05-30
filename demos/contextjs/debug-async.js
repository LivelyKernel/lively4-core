
  new Promise(r => {
    console.log("A")
    r()
  }).then( async (resp) => {
    console.log("B")
    new Promise(async (resolve)=> {
      console.log("C1")
      throw new Error('xxx')
    }).then(r => {
      console.log("C2")
    })
    return
  }).then( r => {
    console.log("D")
  })
  new Promise(r => {
    console.log("E")
  })