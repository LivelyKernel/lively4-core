
function color(r,g,b) {
  return "rgb(" + Math.floor(r * 255) + "," + Math.floor(g * 255)+ "," + Math.floor(b * 255)+")"
}


export default class CrayonColors {
  
  static colorTableNames() {
		return ["cayenne asparagus clover teal midnight plum tin nickel",
			"mocha fern moss ocean eggplant maroon steel aluminum",
			"maraschino lemon spring turquoise blueberry magenta iron magnesium",
			"tangerine lime seafoam aqua grape strawberry tungsten silver",
			"salmon banana flora ice orchid bubblegum lead mercury",
			"cantaloupe honeydew spindrift sky lavender carnation licorice snow"]
	}
	
  static colorTable() {
		return this.colorTableNames().map(ea => ea.split(" ").map( name => {
		  return {name: name, value: this[name]}
		}))
	}

	static colorNames() {
		return this.colorTableNames().join(' ').split(' ');
	}
	
	static show() {
	    var t = document.createElement("div")
      t.innerHTML = this.colorTableNames().map(eaLine => 
        eaLine.split(" ").map(ea => "<span  style='display:inline-block; width:80px; color:" + this[ea]+"'>" + ea + "</span>").join("\n")
      ).join("<br>")
      lively.components.openInWindow(t)

	}

  static	get aluminum() { return color(0.662, 0.662, 0.662)}
  static  get aqua() { return color(0.0, 0.556, 1.0)}
  static  get asparagus() { return color(0.564, 0.584, 0.0)}
  static  get banana() { return color(0.983, 1.0, 0.357)}
  static  get blueberry() { return color(0.227, 0.0, 1.0)}
  static  get bubblegum() { return color(1.0, 0.396, 1.0)}
  static  get cantaloupe() { return color(1.0, 0.843, 0.4)}
  static  get carnation() { return color(1.0, 0.458, 0.862)}
  static  get cayenne() { return color(0.619, 0.0, 0.0)}
  static  get clover() { return color(0.0, 0.591, 0.0)}
  static  get eggplant() { return color(0.365, 0.0, 0.599)}
  static  get fern() { return color(0.207, 0.591, 0.0)}
  static  get flora() { return color(0.141, 1.0, 0.388)}
  static  get grape() { return color(0.65, 0.0, 1.0)}
  static  get honeydew() { return color(0.784, 1.0, 0.369)}
  static  get ice() { return color(0.25, 1.0, 1.0)}
  static  get iron() { return color(0.372, 0.369, 0.372)}
  static  get lavender() { return color(0.897, 0.412, 1.0)}
  static  get lead() { return color(0.129, 0.129, 0.129)}
  static  get lemon() { return color(0.979, 1.0, 0.0)}
  static  get licorice() { return color(0, 0, 0)}
  static  get lime() { return color(0.384, 1.0, 0.0)}
  static  get magenta() { return color(1.0, 0, 1.0)}
  static  get magnesium() { return color(0.753, 0.753, 0.753)}
  static  get maraschino() { return color(1.0, 0, 0)}
  static  get maroon() { return color(0.619, 0.0, 0.321)}
  static  get mercury() { return color(0.921, 0.921, 0.921)}
  static  get midnight() { return color(0.113, 0.0, 0.599)}
  static  get mocha() { return color(0.603, 0.309, 0.0)}
  static  get moss() { return color(0.0, 0.591, 0.285)}
  static  get nickel() { return color(0.572, 0.572, 0.572)}
  static  get ocean() { return color(0.0, 0.309, 0.595)}
  static  get orchid() { return color(0.513, 0.435, 1.0)}
  static  get plum() { return color(0.627, 0.0, 0.595)}
  static  get salmon() { return color(1.0, 0.439, 0.455)}
  static  get seafoam() { return color(0.0, 1.0, 0.521)}
  static  get silver() { return color(0.839, 0.839, 0.839)}
  static  get sky() { return color(0.384, 0.839, 1.0)}
  static  get snow() { return color(1.0, 1.0, 1.0)}
  static  get spindrift() { return color(0.215, 1.0, 0.827)}
  static  get spring() { return "#ECEBBD" }
  static  get steel() { return color(0.474, 0.474, 0.474)}
  static  get strawberry() { return color(1.0, 0.0, 0.58)}
  static  get tangerine() { return color(1.0, 0.56, 0.0)}
  static  get teal() { return color(0.0, 0.584, 0.58)}
  static  get tin() { return color(0.568, 0.568, 0.568)}
  static  get tungsten() { return color(0.258, 0.258, 0.258)}
  static  get turquoise() { return color(0, 1.0, 1.0)}



}