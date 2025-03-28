
<canvas id='canvasOutput' style='border: red 1px solid;'></canvas>

<script>
import qrgen from 'https://lively-kernel.org/lively4/aexpr/src/external/qrcodegen.js'
  const get = id => lively.query(this, '#' + id)
Object.getOwnPropertyNames(qrgen)
const { QrCode } = qrgen
QrCode
var qr = QrCode.encodeText("1234", QrCode.Ecc.HIGH);


	function drawCanvas(qr, scale, border, lightColor, darkColor, canvas) {
		if (scale <= 0 || border < 0)
			throw new RangeError("Value out of range");
		const width = (qr.size + border * 2) * scale;
		canvas.width = width;
		canvas.height = width;
		let ctx = canvas.getContext("2d");
		for (let y = -border; y < qr.size + border; y++) {
			for (let x = -border; x < qr.size + border; x++) {
				ctx.fillStyle = qr.getModule(x, y) ? darkColor : lightColor;
				ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
			}
		}
	}
  
drawCanvas(qr, 8, 1, "#FFFFFF", "#000000", get("canvasOutput"));
</script>