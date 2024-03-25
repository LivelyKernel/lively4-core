## Grid variant

```JavaScript
async function print(fn) {
  const oldBody = window.oldBody = Array.from(document.body.childNodes)
  const bodyCSS = document.body.style.cssText

  try {
    await Promise.race([fn(), lively.sleep(10000)])
    return window.print()

    // await lively.sleep(1000)    
    // await lively.confirm("finished printing?")
  } finally {
    // I'll be back
    document.body.innerHTML = "" // tabula raza
    document.body.style = bodyCSS
    document.body.append(...oldBody)
  }
}

async function test(fn) {
  await Promise.race([fn(that), lively.sleep(10000)])
}

  // position:relative;
  // top: 0;
  // left: 0;

// test(async (body = document.body) => {
print(async (body = document.body) => {
  body.innerHTML = ''
  // body.style = ""
  
  const style = <style></style>;
  style.textContent = `
@page { 
  size: A4 portrait;
  margin: 0;
}

.page {
  page-break-before: always;

  outline: orange solid 10px;

  width: 100vw;
  height: 100vh;
}

.grid-wrapper {
  display: grid;
  place-items: center;
  height: 100vh;
}

.grid {
  outline: green solid 30px;
  z-index: 100;
  display: grid;
  gap: .5cm;
  grid-template-columns: repeat(3, 2.5in);
  width: min-content;
}
`

    // width: min-content;

  
// .block {
//   text-align: center;
//   white-space: nowrap;
// }

  // position: absolute;
  // top: 50%;
  // left: 50%;
  // transform: translate(-50%, -50%);
  
//   display: table-cell;

  // background: palegreen;
  // border: orange solid 10px;

  // background: palegreen;
//   position: relative;
  // display: inline-block;
  // vertical-align: middle;
  body.append(style)

  async function c() {
    return <ubg-card></ubg-card>
  }

  async function gridPage() {
    body.append(<div class='page'><div class='grid-wrapper'><div class='grid'>
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        </div></div></div>)
  }

  await gridPage()
  await gridPage()
  
})
```

## Rect Variant

```JavaScript
async function print(fn) {
  const oldBody = window.oldBody = Array.from(document.body.childNodes)
  const bodyCSS = document.body.style.cssText

  try {
    await Promise.race([fn(), lively.sleep(10000)])
    return window.print()

    // await lively.sleep(1000)    
    // await lively.confirm("finished printing?")
  } finally {
    // I'll be back
    document.body.innerHTML = "" // tabula raza
    document.body.style = bodyCSS
    document.body.append(...oldBody)
  }
}

async function test(fn) {
  await Promise.race([fn(that), lively.sleep(10000)])
}

// test(async (body = document.body) => {
print(async (body = document.body) => {
  body.innerHTML = ''
  // body.style = ""
  
  const style = <style></style>;
  style.textContent = `
@page { 
  size: A4 portrait;
  margin: 0;
}

.page {
  page-break-before: always;

  outline: orange solid 10px;
background: palegreen;
  position:relative;
top: 0;
left: 0;
  width: 210mm;
  height: 297mm;
}

.grid-wrapper {
  outline: blue solid 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.grid {
z-index: 100;
  outline: green solid 30px;
  display: grid;
  gap: .5cm;
  grid-template-columns: repeat(3, 2.5in);
  width: min-content;
}
`

    // width: min-content;

  
// .block {
//   text-align: center;
//   white-space: nowrap;
// }

  // position: absolute;
  // top: 50%;
  // left: 50%;
  // transform: translate(-50%, -50%);
  
//   display: table-cell;

  // background: palegreen;
  // border: orange solid 10px;

  // background: palegreen;
//   position: relative;
  // display: inline-block;
  // vertical-align: middle;
  body.append(style)

  async function c() {
    return <ubg-card></ubg-card>
  }

  async function gridPage() {
    body.append(<div class='page'><div class='grid-wrapper'><div class='grid'>
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        {await c()}
        </div></div></div>)
  }

  await gridPage()
  await gridPage()
  
})
```
