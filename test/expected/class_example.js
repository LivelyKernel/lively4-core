import { getMember as _getMember } from "aexpr-source-transformation-propagation";
import { getLocal as _getLocal } from "aexpr-source-transformation-propagation";
import { setMember as _setMember } from "aexpr-source-transformation-propagation";
class Rectangle {
  constructor(x, y, width, height) {
    let _scope = {};

    _setMember(this, "x", (_getLocal(_scope, "x"), x));
    _setMember(this, "y", (_getLocal(_scope, "y"), y));
    _setMember(this, "width", (_getLocal(_scope, "width"), width));
    _setMember(this, "height", (_getLocal(_scope, "height"), height));
  }

  area() {
    return _getMember(this, "width") * _getMember(this, "height");
  }
}