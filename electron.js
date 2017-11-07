// electron main
console.log(process.versions);

const { app, BrowserWindow } = require('electron');
var ipc = require('electron').ipcMain;

app.on("ready", function () {
  ipc.on("console", function (ev) {
    var args = [].slice.call(arguments, 1);
    var r = console.log.apply(console, args);
    ev.returnValue = [r];
  });
  ipc.on("app", function (ev, msg) {
    var args = [].slice.call(arguments, 2);
    ev.returnValue = [app[msg].apply(app, args)];
  });

  var window = new BrowserWindow();
  window.loadURL("file://" + __dirname + "/start.html");
  window.webContents.openDevTools();
  window.webContents.once("did-finish-load", function () {
    var http = require("http");
    var crypto = require("crypto");
    var server = http.createServer(function (req, res) {
      var port = crypto.randomBytes(16).toString("hex");
      ipc.once(port, function (ev, status, head, body) {
        //console.log(status, head, body);
        res.writeHead(status, head);
        res.end(body);
      });
      window.webContents.send("request", req, port);
    });
    server.listen(8000);
    console.log("http://localhost:8000/");
  });
});
