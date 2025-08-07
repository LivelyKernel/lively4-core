import Morph from "src/components/widgets/lively-morph.js"
import {pt} from "src/client/graphics.js"

/*MD 

# Bouncing Ball

Test: 12


MD*/


export default class Ball extends Morph {

  initialize() {
    this.windowTitle = "Bouncing Atoms";
    this.hits = this.hits || 0;
    if (!this.balls) {
      this.balls = [];
      // Start with 5 balls
      for (let i = 0; i < 5; i++) {
        this.addBall();
      }
    }
    this.ballSize = 5;
    this.registerButtons();
    this.addEventListener('extent-changed', evt => this.onResize(evt));
    
  }
  
  connectedCallback() {
    this.animation = setInterval(() => this.draw(), 20);
    this.onResize(); // Initial size adjustment
  }
  
  disconnectedCallback() {
    clearInterval(this.animation);
  }
  

  draw() {
    var canvas = this.get("#bouncing-ball");
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.balls) return
    this.balls.forEach(ball => {
        context.beginPath();
        
        // Determine ball color based on collision animation
        if (ball.collisionAnimation > 0) {
          const intensity = ball.collisionAnimation / 30; // Fade over 30 frames
          const [origR, origG, origB] = ball.originalColor || [128, 128, 128];
          
          // Use different colors based on collision type
          let collisionColor;
          if (ball.collisionType === 'wall') {
            collisionColor = [0, 0, 255]; // Blue for wall collisions
          } else {
            collisionColor = [255, 0, 0]; // Red for ball-to-ball collisions
          }
          
          // Interpolate from collision color to original color
          const red = Math.round(collisionColor[0] * intensity + origR * (1 - intensity));
          const green = Math.round(collisionColor[1] * intensity + origG * (1 - intensity));
          const blue = Math.round(collisionColor[2] * intensity + origB * (1 - intensity));
          context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          ball.collisionAnimation--;
        } else {
          const [origR, origG, origB] = ball.originalColor || [128, 128, 128];
          context.fillStyle = `rgb(${origR}, ${origG}, ${origB})`;
        }
        
        context.arc(ball.x, ball.y, this.ballSize * 2, 0, Math.PI*2, true);
        context.closePath();
        context.fill();
        this.collisionTest(canvas, ball)
        ball.x += ball.dx * 1;
        ball.y += ball.dy * 1;
    })
    this.shadowRoot.querySelector("#hits").innerHTML = "Hits: " + this.hits
  }

  collisionTest(canvas, ball) {
    if( ball.x < this.ballSize || ball.x> (canvas.width  - this.ballSize)) {
      ball.dx = -ball.dx;
      // Add small random factor to avoid repetitive bouncing
      ball.dx += (Math.random() - 0.5) * 0.2;
      ball.collisionAnimation = 30; // Start animation
      ball.collisionType = 'wall'; // Wall collision
      // console.log("[ball] collide x")

    }
    if( ball.y < this.ballSize || ball.y> (canvas.height - this.ballSize)) {
      ball.dy = -ball.dy;
      // Add small random factor to avoid repetitive bouncing
      ball.dy += (Math.random() - 0.5) * 0.2;
      ball.collisionAnimation = 30; // Start animation
      ball.collisionType = 'wall'; // Wall collision
      // console.log("[ball] collide y")
    }
    
    this.balls.forEach(other => {
      if (other === ball) return;
      var dist = pt(other.x, other.y).dist(pt(ball.x, ball.y))
      if (dist < 2 * this.ballSize) {
        ball.dx *= -1;
        ball.dy *= -1;
        // Add small random factors to both balls to avoid getting stuck
        ball.dx += (Math.random() - 0.5) * 0.3;
        ball.dy += (Math.random() - 0.5) * 0.3;
        other.dx += (Math.random() - 0.5) * 0.3;
        other.dy += (Math.random() - 0.5) * 0.3;
        
        ball.collisionAnimation = 30; // Start animation
        ball.collisionType = 'ball'; // Ball collision
        other.collisionAnimation = 30; // Both balls animate
        other.collisionType = 'ball'; // Ball collision
        this.hits++
      }
    })
    
  }
  
  onAddButton() {
    this.addBall()
  }

  // this.addBall()
  addBall() {
    this.balls.push({dx: 2 * Math.random(), dy: 2 * Math.random(), 
                      y: 200 * Math.random(), x: 200  * Math.random(), 
                      collisionAnimation: 0, collisionType: null, originalColor: [128, 128, 128]}) // gray
  }
  
  // this.removeBall()
  removeBall() {
    this.balls.pop()
  }
  
  onResize() {
    const canvas = this.get("#bouncing-ball");
    if (!canvas) return;
    
    // Store old dimensions
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    // Get the container size
    const container = this.get("#container");
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const parentRect = this.getBoundingClientRect();
    
    // Adjust canvas size to fit the window/container, leaving some margin
    const newWidth = Math.max(300, parentRect.width - 40);
    const newHeight = Math.max(200, parentRect.height - 80);
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Adjust ball positions to stay within new boundaries
    if (this.balls && (oldWidth !== newWidth || oldHeight !== newHeight)) {
      this.balls.forEach(ball => {
        // Clamp ball position to new canvas size
        ball.x = Math.min(Math.max(this.ballSize, ball.x), newWidth - this.ballSize);
        ball.y = Math.min(Math.max(this.ballSize, ball.y), newHeight - this.ballSize);
      });
    }
  }

  // lively mirgrate is executed after constructor, but before initializer #Design?
  livelyMigrate(oldInstance) {
    if (oldInstance.balls)
       this.balls = oldInstance.balls
    if (oldInstance.hits)
       this.hits = oldInstance.hits
  }
}