import { getScopeIdForModule } from "src/external/babel-plugin-var-recorder.js";

class TestClass {
  static update() {
    console.log('something');
    var a = 7;
    var b = 5;
  }

  static print() {
    console.log("someething");
  }

}

class TestClass2 {
  static update2() {
    var variables = _recorder_[getScopeIdForModule()];

    console.log('something');
  }

  static print2() {
    console.log('printtttttt');
  }

}