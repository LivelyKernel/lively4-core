
export default class CrayonColors {

  static color(r,g,b) {
    return "rgb(" + Math.floor(r * 255) + "," + Math.floor(g * 255)+ "," + Math.floor(b * 255)+")"
  }

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
    var t = <table>{... this.colorTableNames().map(eaLine => 
      <tr>{...
        eaLine.split(" ").map(ea => { 
          var span = <td>{ea}</td>
          span.style.backgroundColor = this[ea]
          span.style.color = this.foreground(ea) 
          span.style.width = "80px"
          span.style.paddingLeft = "10px"
          return span       
        })}
      </tr>
    )}</table>
    lively.components.openInWindow(t)

	}
  
  static foreground(name) {
    var foreground = Object.create(this)
    foreground.color = function(r,g,b) {
      var total = r + g + b
      return total > 1.5 ? "black" : "white"
    }
    return foreground[name]
  }
  
  static get aluminum() { return this.color(0.662, 0.662, 0.662)}
  static get aqua() { return this.color(0.0, 0.556, 1.0)}
  static get asparagus() { return this.color(0.564, 0.584, 0.0)}
  static get banana() { return this.color(0.983, 1.0, 0.357)}
  static get blueberry() { return this.color(0.227, 0.0, 1.0)}
  static get bubblegum() { return this.color(1.0, 0.396, 1.0)}
  static get cantaloupe() { return this.color(1.0, 0.843, 0.4)}
  static get carnation() { return this.color(1.0, 0.458, 0.862)}
  static get cayenne() { return this.color(0.619, 0.0, 0.0)}
  static get clover() { return this.color(0.0, 0.591, 0.0)}
  static get eggplant() { return this.color(0.365, 0.0, 0.599)}
  static get fern() { return this.color(0.207, 0.591, 0.0)}
  static get flora() { return this.color(0.141, 1.0, 0.388)}
  static get grape() { return this.color(0.65, 0.0, 1.0)}
  static get honeydew() { return this.color(0.784, 1.0, 0.369)}
  static get ice() { return this.color(0.25, 1.0, 1.0)}
  static get iron() { return this.color(0.372, 0.369, 0.372)}
  static get lavender() { return this.color(0.897, 0.412, 1.0)}
  static get lead() { return this.color(0.129, 0.129, 0.129)}
  static get lemon() { return this.color(0.979, 1.0, 0.0)}
  static get licorice() { return this.color(0, 0, 0)}
  static get lime() { return this.color(0.384, 1.0, 0.0)}
  static get magenta() { return this.color(1.0, 0, 1.0)}
  static get magnesium() { return this.color(0.753, 0.753, 0.753)}
  static get maraschino() { return this.color(1.0, 0, 0)}
  static get maroon() { return this.color(0.619, 0.0, 0.321)}
  static get mercury() { return this.color(0.921, 0.921, 0.921)}
  static get midnight() { return this.color(0.113, 0.0, 0.599)}
  static get mocha() { return this.color(0.603, 0.309, 0.0)}
  static get moss() { return this.color(0.0, 0.591, 0.285)}
  static get nickel() { return this.color(0.572, 0.572, 0.572)}
  static get ocean() { return this.color(0.0, 0.309, 0.595)}
  static get orchid() { return this.color(0.513, 0.435, 1.0)}
  static get plum() { return this.color(0.627, 0.0, 0.595)}
  static get salmon() { return this.color(1.0, 0.439, 0.455)}
  static get seafoam() { return this.color(0.0, 1.0, 0.521)}
  static get silver() { return this.color(0.839, 0.839, 0.839)}
  static get sky() { return this.color(0.384, 0.839, 1.0)}
  static get snow() { return this.color(1.0, 1.0, 1.0)}
  static get spindrift() { return this.color(0.215, 1.0, 0.827)}
  static get spring() { return this.color(0.9254901960784314,0.9176470588235294, 0.7450980392156863); }
  static get steel() { return this.color(0.474, 0.474, 0.474)}
  static get strawberry() { return this.color(1.0, 0.0, 0.58)}
  static get tangerine() { return this.color(1.0, 0.56, 0.0)}
  static get teal() { return this.color(0.0, 0.584, 0.58)}
  static get tin() { return this.color(0.568, 0.568, 0.568)}
  static get tungsten() { return this.color(0.258, 0.258, 0.258)}
  static get turquoise() { return this.color(0, 1.0, 1.0)}
}