# Some draw.io reverse engineering....

When exporting a PDF in draw.io, the google dev tools recorded the following request


```
Request URL: https://exp.draw.io/ImageExport4/export
Request Method: POST
Status Code: 200 OK
Remote Address: 199.38.81.35:443
Referrer Policy: no-referrer-when-downgrade
```

## Response Headers

```
HTTP/1.1 200 OK
Date: Sat, 26 Jan 2019 19:00:55 GMT
Server: Apache
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-disposition: attachment; filename="testdrawio.pdf"; filename*=UTF-8''testdrawio.pdf
Content-type: text/plain; charset=utf-8
Vary: Accept-Encoding
Content-Encoding: gzip
Keep-Alive: timeout=5, max=100
Connection: Keep-Alive
Transfer-Encoding: chunked
```

## Request Headers

```
POST /ImageExport4/export HTTP/1.1
Host: exp.draw.io
Connection: keep-alive
Content-Length: 1065
Origin: https://www.draw.io
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36
Content-Type: application/x-www-form-urlencoded
Accept: */*
Referer: https://www.draw.io/
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.9,de;q=0.8
```

## fromData

```
format=pdf&bg=#ffffff&base64=1&embedXml=0&xml=%3Cmxfile%20modified%3D%222019-01-26T19%3A00%3A48.908Z%22%20host%3D%22www.draw.io%22%20agent%3D%22Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F71.0.3578.98%20Safari%2F537.36%22%20version%3D%2210.1.4%22%20etag%3D%22JVROaZdnLW3DEGmiwtOJ%22%20type%3D%22github%22%3E%3Cdiagram%20name%3D%22Page-1%22%20id%3D%2297a40813-6b03-0c74-37c1-0168de264b11%22%3ErZRLb4MwDMc%2FDXeeexxb2nWHTprUw84BXIgWMEpNofv0S5rwGq00TeMAzs924vzj4ARx2e0kq4s3zEA4vpt1TrBxfD%2BKQvXW4GLAc%2FRoQC55ZpA3ggP%2FAgtdSxuewWkWSIiCeD2HKVYVpDRjTEps52FHFPNVa5bDAhxSJpb0g2dUGPoUuSN%2FBZ4XduXItY6EpZ%2B5xKayyzl%2BcLw%2Bxl2yfiobfypYhu0EBVsniCUiGavsYhBa2V41k%2FdyxzuULaGi3yT4JuHMRAN9xde66NJLoUqstZk2ifqs24ITHGqWataqw1esoFKokafMRO8dsn3Sg2VFtsgzSIJugmyFO8ASSF5UiPU%2BWLFsL4V22I4HE%2FZ6FpNDGfKYbYZ8mHlURBlWlNsChQuBVimhvKtSUwoTEKz1BrlqqT1LQLzjiRPHSoUkSISlChDasR46Jkah8zZjz4xzrATPdS7hD72xIcEriId74P6P5r47F93zlqoHN0T%2Fg%2BZqODb81Tf5pwTbbw%3D%3D%3C%2Fdiagram%3E%3C%2Fmxfile%3E&filename=testdrawio.pdf
```

## Draw.io PDF Export

```javascript

var result = fetch("https://exp.draw.io/ImageExport4/export", {
  method: "POST",
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: `format=pdf&bg=#ffffff&base64=1&embedXml=0&xml=%3Cmxfile%20modified%3D%222019-01-26T19%3A00%3A48.908Z%22%20host%3D%22www.draw.io%22%20agent%3D%22Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F71.0.3578.98%20Safari%2F537.36%22%20version%3D%2210.1.4%22%20etag%3D%22JVROaZdnLW3DEGmiwtOJ%22%20type%3D%22github%22%3E%3Cdiagram%20name%3D%22Page-1%22%20id%3D%2297a40813-6b03-0c74-37c1-0168de264b11%22%3ErZRLb4MwDMc%2FDXeeexxb2nWHTprUw84BXIgWMEpNofv0S5rwGq00TeMAzs924vzj4ARx2e0kq4s3zEA4vpt1TrBxfD%2BKQvXW4GLAc%2FRoQC55ZpA3ggP%2FAgtdSxuewWkWSIiCeD2HKVYVpDRjTEps52FHFPNVa5bDAhxSJpb0g2dUGPoUuSN%2FBZ4XduXItY6EpZ%2B5xKayyzl%2BcLw%2Bxl2yfiobfypYhu0EBVsniCUiGavsYhBa2V41k%2FdyxzuULaGi3yT4JuHMRAN9xde66NJLoUqstZk2ifqs24ITHGqWataqw1esoFKokafMRO8dsn3Sg2VFtsgzSIJugmyFO8ASSF5UiPU%2BWLFsL4V22I4HE%2FZ6FpNDGfKYbYZ8mHlURBlWlNsChQuBVimhvKtSUwoTEKz1BrlqqT1LQLzjiRPHSoUkSISlChDasR46Jkah8zZjz4xzrATPdS7hD72xIcEriId74P6P5r47F93zlqoHN0T%2Fg%2BZqODb81Tf5pwTbbw%3D%3D%3C%2Fdiagram%3E%3C%2Fmxfile%3E&filename=testdrawio.pdf`
})

var blob, resp, text;
(async () => {
  resp = await result
  text = await resp.text()


  var url = "data:pdf;" + text
  fetch("data:application/pdf;base64,"+text).then(r => r.blob()).then(blob => {
    fetch("https://lively-kernel.org/lively4/lively4-jens/doc/figures/test.pdf", 
      {
        method: "PUT",
        body: blob
    })  
  })
  // AND IT Works!!!! Yeah!

})()

```

To make use of this we have to add it into our drawio viewer.... :-) #TODO 
This will be the last step in a full online paper writing experience...

1. Lively can edit markdown files in GitHub 
  - lively can display local draw.io xml figures
  - lively can navigate to draw.io figures (through shared GitHub)
  - lively can initiate PDF export of a drawio figure and store them in GitHub (easier then drawio export dialog chain)
  - #TODO make checking out private repositories work
2. Draw.io can editor figures stored in github
3. Overleaf can sync with GitHub projects 
  - overleaf can build LateX with markdown imports
  - (manual sync button with github?)

