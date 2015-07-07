var browser = require("zombie").create();
browser.visit("file://" + process.cwd() + "/standalone/test.html", function () {
    if (browser.errors.length > 0) {
        throw ["Errors:"].concat(browser.errors).join("\n");
    }
    console.log("Tests run: " + browser.window.runcount);
    if (browser.window.GlobalErrors.length != 0) {
        throw ["Errors: " + browser.window.GlobalErrors.length].concat(
            browser.window.GlobalErrors
        ).join("\n");
    }
});
