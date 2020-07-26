import Morph from "src/components/widgets/lively-morph.js"
import {pt} from "src/client/graphics.js"



export default class Ball extends Morph {

  initialize() {
    this.windowTitle = "Bouncing Atoms";
    this.hits = this.hits || 0;
    if (!this.balls) {
      this.balls =  [{dx: 1, dy: 2, y: 180, x: 20}];
    }
    this.size = 10;
    this.registerButtons();
  }
  
  attachedCallback() {
    this.animation = setInterval(() => this.draw(), 20);
  }
  
  detachedCallback() {
    clearInterval(this.animation);
  }
  
  draw() {
    var canvas = this.get("#bouncing-ball");
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.balls) return
    this.balls.forEach(ball => {
        context.beginPath();
        context.fillStyle = "blue";
        context.arc(ball.x, ball.y, this.size * 2, 0, Math.PI*2, true);
        context.closePath();
        context.fill();
        this.collisionTest(canvas, ball)
        ball.x += ball.dx * 1;
        ball.y += ball.dy * 1;
    })
    this.shadowRoot.querySelector("#hits").innerHTML = "Hits: " + this.hits
  }

  collisionTest(canvas, ball) {
    if( ball.x < this.size || ball.x> (canvas.width  - this.size)) {
      ball.dx =- ball.dx;
      this.hits++
      console.log("[ball] collide x")

    }
    if( ball.y < this.size || ball.y> (canvas.height - this.size)) {
      ball.dy =- ball.dy;
      this.hits++
      console.log("[ball] collide y")
    }
    
    this.balls.forEach(other => {
      if (other === ball) return;
      var dist = pt(other.x, other.y).dist(pt(ball.x, ball.y))
      if (dist < 2 * this.size) {
        ball.dx *= -1
        ball.dy *= -1
      }
    })
    
  }
  
  onAddButton() {
    this.addBall()
  }

  // this.addBall()
  addBall() {
    this.balls.push({dx: 2 * Math.random(), dy: 2 * Math.random(), 
                      y: 200 * Math.random(), x: 200  * Math.random()})
  }
  
  // this.removeBall()
  removeBall() {
    this.balls.pop()
  }

  // lively mirgrate is executed after constructor, but before initializer #Design?
  livelyMigrate(oldInstance) {
    if (oldInstance.balls)
       this.balls = oldInstance.balls
    if (oldInstance.hits)
       this.hits = oldInstance.hits
  }
}