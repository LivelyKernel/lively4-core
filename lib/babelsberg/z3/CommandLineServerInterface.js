lively.ide = lively.ide || {};
if (!lively.ide.CommandLineInterface) {
    lively.ide.CommandLineInterface = {
        run: function (commandString, options, thenDo) {
            if (!CommandLineInterface.run) {
                throw "The deployment should have defined CommandLineInterface.run"
            } else {
                return CommandLineInterface.run(commandString, options, thenDo);
            }
        },
        runAll: function (commandSpecs, thenDo) {
            if (!CommandLineInterface.runAll) {
                throw "The deployment should have defined CommandLineInterface.runAll"
            } else {
                return CommandLineInterface.runAll(commandSpecs, thenDo);
            }
        },
        cwd: function () {
            if (!CommandLineInterface.cwd) {
                throw "The deployment should have defined CommandLineInterface.cwd"
            } else {
                return CommandLineInterface.cwd();
            }
        },
    }
}
