var context = require.context(".", true, /^((?![\\/]integration[\\/]).)*\.spec$/);
context.keys().forEach(context);
module.exports = context;