function fall() {
  this.v += 9.81 * 0.005;
  this.parentElement.querySelector("h2").innerHTML = "v = " + this.v;
  var bottom = this.parentElement.clientHeight;
  var y = parseFloat(this.style.top);
    if (y < bottom - this.clientHeight) {
      $(this).css('top', y+this.v);
      this.timeout = setTimeout(this.fall, 5);
    } else {
      this.bump();
    }
}

function bump() {
  this.v -= 9.81 * 0.005;
  this.parentElement.querySelector("h2").innerHTML = "v = -" + this.v;
  var bottom = this.parentElement.clientHeight;
  var y = parseFloat(this.style.top);
    if (this.v > 0) {
      $(this).css('top', y-this.v);
      this.timeout = setTimeout(this.bump, 5);
    } else {
      this.fall();
    }
}

function startFalling() {
  this.v = 0;
  this.fall();
}

function stopFalling() {
    clearTimeout(this.timeout);
}