
import Morph from "./Morph.js"


export default class Ball extends Morph {

  initialize() {
    
    document.title = "Lively 4 Debug Target"
    
    this.windowTitle = "Bouncing Ball"
    this.hits = 0
    if (!this.balls) {
      this.balls =  [{dx: 1, dy: 2, y: 150, x: 10}]
    }
  }
  
  attachedCallback() {
    this.animation = setInterval(() => this.draw(), 20);
  }
  
  detachedCallback() {
    clearInterval(this.animation)
  }
  
  draw() {
    
    foo.bar()
    var context = $(this.shadowRoot).find("#bouncing-ball")[0].getContext('2d');
    context.clearRect(0, 0, 300, 300);

    if (!this.balls) return
    this.balls.forEach(ball => {

        context.beginPath();
        context.fillStyle = "red";
        context.arc(ball.x, ball.y, 10, 0, Math.PI*2, true);
        context.closePath();
        context.fill();
        this.collisionTest(ball)
        ball.x += ball.dx;
        ball.y += ball.dy;
    })
    this.shadowRoot.querySelector("#hits").innerHTML = "_Hits: " + this.hits
  }

  collisionTest(ball) {
    if( ball.x<0 || ball.x>300) {
      ball.dx =- ball.dx;
      this.hits++
      console.log("[ball] collide x")

    }
    if( ball.y<0 || ball.y>300) {
      ball.dy =- ball.dy;
      this.hits++
      console.log("[ball] collide y")
    }
  }

  livelyMigrate(oldInstance) {
    if (oldInstance.balls)
       this.balls = oldInstance.balls
    if (oldInstance.hits)
       this.hits = oldInstance.hits

  }

}