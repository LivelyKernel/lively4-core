import { getMember as _getMember } from "aexpr-source-transformation-propagation";
import { setMember as _setMember } from "aexpr-source-transformation-propagation";
class Rectangle {
  constructor(x, y, width, height) {
    _setMember(this, "x", "=", x);
    _setMember(this, "y", "=", y);
    _setMember(this, "width", "=", width);
    _setMember(this, "height", "=", height);
  }

  area() {
    return _getMember(this, "width") * _getMember(this, "height");
  }
}