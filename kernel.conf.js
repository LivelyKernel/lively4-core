const path = require('path')

module.exports = {
  "WORKER_ENABLED": true,
  "WORKER_INIT": path.resolve(__dirname, "src/swx.js"),
  "WORKER_EMBED": true,
}
