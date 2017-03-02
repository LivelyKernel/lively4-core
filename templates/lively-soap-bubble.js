
import Ball from "./lively-bouncing-ball.js"


export default class Soap extends Ball {
  initialize() {
    super.initialize()
    this.windowTitle = "Soapy " + this.windowTitle
    this.balls =[{dx: 0.0, dy: 0.4, y: 150, x: 100}]
    setInterval(() => this.draw(), 2);
  }

  collisionTest(ball) {
    if( ball.x<0 || ball.x>300) {
      this.explode(ball)
    }
    if( ball.y<0 || ball.y>300) {
      this.explode(ball) 
    }
  }

  explode(ball) {
    this.balls = this.balls.filter(ea => ea !== ball)
  }

}