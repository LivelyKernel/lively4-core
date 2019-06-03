function /*example:*/drawSmiley/*{"id":"2bfb_d5bb_5570","name":{"mode":"input","value":"Simpson"},"color":"hsl(40, 30%, 70%)","values":{"canvas":{"mode":"select","value":"43d5_2cde_800c"},"eyeColor":{"mode":"input","value":"\"blue\""},"skinColor":{"mode":"input","value":"\"yellow\""}},"instanceId":{"mode":"input","value":""},"prescript":"canvas.getContext(\"2d\").clearRect(0, 0, canvas.width, canvas.height);","postscript":""}*/(canvas, eyeColor, skinColor) {
  if (canvas.getContext) {
    let ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.arc(75, 75, 50, 0, Math.PI * 2, true); // Outer circle
    ctx.stroke();
    ctx.fillStyle = skinColor;
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(110, 75);
    ctx.arc(75, 75, 35, 0, Math.PI, false);  // Mouth (clockwise)
    ctx.stroke();
    
    ctx.fillStyle = eyeColor;
    const eyeDistance = 35;
    const numEyes = 2;
    for(let i = 0; i < numEyes; i++) {
      const eyePosX = 60 + i*(eyeDistance / (numEyes-1));
      ctx.beginPath();
      ctx.moveTo(eyePosX, 65);
      ctx.arc(eyePosX, 65, 5, 0, Math.PI * 2, true);  // Eye
      ctx.stroke();
      /*probe:*/ctx/*{}*/.fill();
    }
  }
}

/* Context: {"context":{"prescript":"console.log(\"before module\");","postscript":""},"customInstances":[{"id":"43d5_2cde_800c","name":"A Canvas","code":"return document.createElement(\"canvas\")"}]} */