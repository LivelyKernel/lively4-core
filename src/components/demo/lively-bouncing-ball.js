import Morph from "src/components/widgets/lively-morph.js"
import {pt} from "src/client/graphics.js"

/*MD 

# Bouncing Ball

![](lively-bouncing-ball.png)


MD*/


export default class Ball extends Morph {

  initialize() {
    this.windowTitle = "Bouncing Atoms";
    this.hits = this.hits || 0;
    this.wallHits = this.wallHits || 0;
    this.frameCount = 0;
    this.ballSize = 5;
    
    // Statistics tracking
    this.lastSecond = Date.now();
    this.ballHitsPerSecond = 0;
    this.wallHitsPerSecond = 0;
    this.tempBallHits = 0;
    this.tempWallHits = 0;
    
    // FPS tracking
    this.fpsFrames = 0;
    this.lastFpsUpdate = Date.now();
    this.fps = 0;
    
    // Temperature tracking (energy dissipated as heat)
    this.temperature = 0;
    this.temperatureScale = this.temperatureScale || 10; // Max temp for color mapping
    this.coolingRate = 0.9995; // System cooling rate per frame (0.05% heat loss per frame)
    
    // Restore speed from attributes
    const savedSpeed = this.getAttribute("data-speed");
    this.speedMultiplier = savedSpeed ? parseFloat(savedSpeed) : 0.5;
    
    // Restore friction from attributes
    const savedFriction = this.getAttribute("data-friction");
    this.frictionFactor = savedFriction ? parseFloat(savedFriction) : 0.95;
    
    // Restore ball size from attributes
    const savedBallSize = this.getAttribute("data-ballsize");
    if (savedBallSize) {
      this.ballSize = parseInt(savedBallSize);
    }
    
    // Restore temperature scale from attributes
    const savedTempScale = this.getAttribute("data-tempscale");
    if (savedTempScale) {
      this.temperatureScale = parseFloat(savedTempScale);
    }
    
    // Restore cooling rate from attributes
    const savedCooling = this.getAttribute("data-cooling");
    if (savedCooling) {
      this.coolingRate = parseFloat(savedCooling);
    }
    
    // Restore balls from attributes
    const savedBalls = this.getAttribute("data-balls");
    if (savedBalls && !this.balls) {
      try {
        this.balls = JSON.parse(savedBalls);
      } catch (e) {
        console.warn("Could not restore balls data:", e);
        this.balls = [];
      }
    }
    
    // Create initial balls if none exist
    if (!this.balls || this.balls.length === 0) {
      this.balls = [];
      for (let i = 0; i < 5; i++) {
        this.addBall();
      }
    }
    this.registerButtons();
    this.addEventListener('extent-changed', evt => this.onResize(evt));
    
    // Set up continuous button press handling
    this.setupContinuousButtons();
    
    // Set up canvas click handling
    this.setupCanvasClick();
    
    // Set up speed slider
    this.setupSpeedSlider();
    
    // Set up friction slider
    this.setupFrictionSlider();
    
    // Set up balls slider
    this.setupBallsSlider();
    
    // Set up ball size slider
    this.setupBallSizeSlider();
    
    // Set up temperature scale slider
    this.setupTempScaleSlider();
    
    // Set up cooling slider
    this.setupCoolingSlider();
  }
  
  connectedCallback() {
    this.animation = setInterval(() => this.draw(), 20);
    this.onResize(); // Initial size adjustment
  }
  
  disconnectedCallback() {
    clearInterval(this.animation);
  }
  

  draw() {
    this.frameCount++;
    var canvas = this.get("#bouncing-ball");
    if (!canvas) {
      console.log(`[draw] Canvas not found at frame ${this.frameCount}`);
      return;
    }
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.balls) {
      console.log(`[draw] No balls array at frame ${this.frameCount}`);
      return;
    }
    
    if (this.frameCount % 60 === 0) {
      console.log(`[draw] Frame ${this.frameCount}: ${this.balls.length} balls, canvas: ${canvas.width}x${canvas.height}`);
    }
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
          } else if (ball.collisionType === 'create') {
            collisionColor = [0, 255, 0]; // Green for newly created balls
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
        
        context.arc(ball.x, ball.y, this.ballSize, 0, Math.PI*2, true);
        context.closePath();
        context.fill();
        this.collisionTest(canvas, ball)
        ball.x += ball.dx * this.speedMultiplier;
        ball.y += ball.dy * this.speedMultiplier;
    })
    
    // Apply continuous cooling every frame
    this.temperature *= this.coolingRate;
    
    // Update background color based on temperature
    this.updateBackgroundColor();
    
    // Update FPS tracking
    this.fpsFrames++;
    const now = Date.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round(this.fpsFrames * 1000 / (now - this.lastFpsUpdate));
      this.fpsFrames = 0;
      this.lastFpsUpdate = now;
    }
    
    // Update statistics every second
    if (now - this.lastSecond >= 1000) {
      this.ballHitsPerSecond = this.tempBallHits;
      this.wallHitsPerSecond = this.tempWallHits;
      this.tempBallHits = 0;
      this.tempWallHits = 0;
      this.lastSecond = now;
    }
    
    this.shadowRoot.querySelector("#hits").innerHTML = "Ball hits: " + this.hits + " (" + this.ballHitsPerSecond + "/s)"
    this.shadowRoot.querySelector("#ballCount").innerHTML =  "Balls: " + this.balls.length
    this.shadowRoot.querySelector("#wallHits").innerHTML = "Wall hits: " + this.wallHits + " (" + this.wallHitsPerSecond + "/s)"
    this.shadowRoot.querySelector("#fps").innerHTML = "FPS: " + this.fps
    this.shadowRoot.querySelector("#temperature").innerHTML = "Temp: " + this.temperature.toFixed(2)
  }

  collisionTest(canvas, ball) {
    const frictionFactor = this.frictionFactor; // Dynamic friction from slider
    
    // X-axis wall collisions
    if (ball.x <= this.ballSize) {
      const originalSpeed = Math.abs(ball.dx);
      ball.dx = originalSpeed * frictionFactor; // Apply friction
      ball.x = this.ballSize; // Prevent wall penetration
      ball.collisionAnimation = 30;
      ball.collisionType = 'wall';
      this.wallHits++;
      this.tempWallHits++;
      
      // Add energy lost to temperature
      const energyLost = originalSpeed * (1 - frictionFactor);
      this.addHeat(energyLost);
    } else if (ball.x >= canvas.width - this.ballSize) {
      const originalSpeed = Math.abs(ball.dx);
      ball.dx = -originalSpeed * frictionFactor; // Apply friction
      ball.x = canvas.width - this.ballSize; // Prevent wall penetration
      ball.collisionAnimation = 30;
      ball.collisionType = 'wall';
      this.wallHits++;
      this.tempWallHits++;
      
      // Add energy lost to temperature
      const energyLost = originalSpeed * (1 - frictionFactor);
      this.addHeat(energyLost);
    }
    
    // Y-axis wall collisions
    if (ball.y <= this.ballSize) {
      const originalSpeed = Math.abs(ball.dy);
      ball.dy = originalSpeed * frictionFactor; // Apply friction
      ball.y = this.ballSize; // Prevent wall penetration
      ball.collisionAnimation = 30;
      ball.collisionType = 'wall';
      this.wallHits++;
      this.tempWallHits++;
      
      // Add energy lost to temperature
      const energyLost = originalSpeed * (1 - frictionFactor);
      this.addHeat(energyLost);
    } else if (ball.y >= canvas.height - this.ballSize) {
      const originalSpeed = Math.abs(ball.dy);
      ball.dy = -originalSpeed * frictionFactor; // Apply friction
      ball.y = canvas.height - this.ballSize; // Prevent wall penetration
      ball.collisionAnimation = 30;
      ball.collisionType = 'wall';
      this.wallHits++;
      this.tempWallHits++;
      
      // Add energy lost to temperature
      const energyLost = originalSpeed * (1 - frictionFactor);
      this.addHeat(energyLost);
    }
    
    this.balls.forEach(other => {
      if (other === ball) return;
      if (ball.lastCollisionFrame === this.frameCount) return; // Prevent multiple collisions per frame
      if (other.lastCollisionFrame === this.frameCount) return; // Prevent counting same collision twice
      
      var dist = pt(other.x, other.y).dist(pt(ball.x, ball.y))
      if (dist < 2 * this.ballSize && dist > 0) {
        // Calculate collision angle
        const dx = other.x - ball.x;
        const dy = other.y - ball.y;
        const angle = Math.atan2(dy, dx);
        
        // Calculate velocities in collision normal direction
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        
        // Rotate ball velocities to collision coordinate system
        const vx1 = ball.dx * cos + ball.dy * sin;
        const vy1 = ball.dy * cos - ball.dx * sin;
        const vx2 = other.dx * cos + other.dy * sin;
        const vy2 = other.dy * cos - other.dx * sin;
        
        // Swap velocities in collision direction (elastic collision)
        const newVx1 = vx2;
        const newVx2 = vx1;
        
        // Rotate back to world coordinate system
        ball.dx = newVx1 * cos - vy1 * sin;
        ball.dy = vy1 * cos + newVx1 * sin;
        other.dx = newVx2 * cos - vy2 * sin;
        other.dy = vy2 * cos + newVx2 * sin;
        
        // Separate balls to prevent overlap
        const overlap = 2 * this.ballSize - dist;
        const separationX = (dx / dist) * overlap * 0.5;
        const separationY = (dy / dist) * overlap * 0.5;
        ball.x -= separationX;
        ball.y -= separationY;
        other.x += separationX;
        other.y += separationY;
        
        // Mark collision frame to prevent multiple collisions
        ball.lastCollisionFrame = this.frameCount;
        other.lastCollisionFrame = this.frameCount;
        
        ball.collisionAnimation = 30;
        ball.collisionType = 'ball';
        other.collisionAnimation = 30;
        other.collisionType = 'ball';
        this.hits++;
        this.tempBallHits++;
      }
    })
    
  }
  
  // Add energy directly to temperature
  addHeat(energyLost) {
    // Simply accumulate all friction energy as heat
    this.temperature += energyLost;
  }
  
  // Update canvas background color based on temperature
  updateBackgroundColor() {
    const canvas = this.get("#bouncing-ball");
    if (!canvas) return;
    
    // Map temperature to color spectrum (0 = icy blue, higher = red/yellow)
    const normalizedTemp = Math.min(this.temperature / this.temperatureScale, 1);
    
    let r, g, b;
    
    if (normalizedTemp < 0.33) {
      // Deep blue to light blue (0-33%)
      const t = normalizedTemp / 0.33;
      r = Math.round(50 + (150 * t)); // 50 -> 200
      g = Math.round(100 + (155 * t)); // 100 -> 255
      b = 255; // Always full blue
    } else if (normalizedTemp < 0.67) {
      // Light blue to white (33-67%)
      const t = (normalizedTemp - 0.33) / 0.34;
      r = Math.round(200 + (55 * t)); // 200 -> 255
      g = 255; // Keep at max
      b = 255; // Keep at max
    } else {
      // White to red (67-100%)
      const t = (normalizedTemp - 0.67) / 0.33;
      r = 255; // Keep at max red
      g = Math.round(255 - (255 * t)); // 255 -> 0
      b = Math.round(255 - (255 * t)); // 255 -> 0
    }
    
    canvas.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  }
  
  onAddButton() {
    this.addBall();
    this.updateBallsSlider();
  }
  
  onRemoveButton() {
    this.removeBall();
    this.updateBallsSlider();
  }
  
  setupContinuousButtons() {
    const addButton = this.get('#addButton');
    const removeButton = this.get('#removeButton');
    
    if (addButton) {
      let addInterval = null;
      
      addButton.addEventListener('mousedown', () => {
        console.log('[addButton] Mouse down - starting continuous add');
        this.addBall(); // Add one immediately
        this.updateBallsSlider();
        addInterval = setInterval(() => {
          if (this.balls.length < 10000) { // Safety limit
            this.addBall();
            this.updateBallsSlider();
          } else {
            console.warn('[addButton] Ball limit reached (10000), stopping auto-add');
            stopAdding();
          }
        }, 50); // Add ball every 50ms while held
      });
      
      const stopAdding = () => {
        if (addInterval) {
          console.log('[addButton] Stopping continuous add');
          clearInterval(addInterval);
          addInterval = null;
        }
      };
      
      addButton.addEventListener('mouseup', stopAdding);
      addButton.addEventListener('mouseleave', stopAdding);
    }
    
    if (removeButton) {
      let removeInterval = null;
      
      removeButton.addEventListener('mousedown', () => {
        this.removeBall(); // Remove one immediately
        this.updateBallsSlider();
        removeInterval = setInterval(() => {
          this.removeBall();
          this.updateBallsSlider();
        }, 50); // Remove ball every 50ms while held
      });
      
      const stopRemoving = () => {
        if (removeInterval) {
          clearInterval(removeInterval);
          removeInterval = null;
        }
      };
      
      removeButton.addEventListener('mouseup', stopRemoving);
      removeButton.addEventListener('mouseleave', stopRemoving);
    }
  }
  
  setupCanvasClick() {
    const canvas = this.get('#bouncing-ball');
    if (!canvas) return;
    
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Apply repulsion force to all balls
      this.balls.forEach(ball => {
        const dx = ball.x - clickX;
        const dy = ball.y - clickY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          // Normalize the vector and apply force (inversely proportional to distance)
          const force = Math.min(200 / distance, 5); // Maximum force of 5
          const forceX = (dx / distance) * force * 0.3;
          const forceY = (dy / distance) * force * 0.3;
          
          ball.dx += forceX;
          ball.dy += forceY;
        }
      });
    });
  }
  
  setupSpeedSlider() {
    const slider = this.get('#speedSlider');
    const display = this.get('#speedDisplay');
    
    if (!slider || !display) return;
    
    // Set initial value
    slider.value = this.speedMultiplier;
    display.textContent = `${this.speedMultiplier}x`;
    
    // Handle slider changes
    slider.addEventListener('input', (event) => {
      this.speedMultiplier = parseFloat(event.target.value);
      display.textContent = `${this.speedMultiplier}x`;
    });
  }
  
  setupFrictionSlider() {
    const slider = this.get('#frictionSlider');
    const display = this.get('#frictionDisplay');
    
    if (!slider || !display) return;
    
    // Set initial value
    slider.value = this.frictionFactor;
    display.textContent = this.frictionFactor.toFixed(2);
    
    // Handle slider changes
    slider.addEventListener('input', (event) => {
      this.frictionFactor = parseFloat(event.target.value);
      display.textContent = this.frictionFactor.toFixed(2);
    });
  }
  
  setupBallsSlider() {
    const slider = this.get('#ballsSlider');
    const display = this.get('#ballsDisplay');
    
    if (!slider || !display) return;
    
    // Configure slider for logarithmic scale (0-100 maps to 0-2000 exponentially)
    slider.min = 0;
    slider.max = 100;
    slider.step = 1;
    
    // Set initial value (convert from ball count to slider position)
    slider.value = this.ballCountToSliderValue(this.balls.length);
    display.textContent = this.balls.length;
    
    // Handle slider changes
    slider.addEventListener('input', (event) => {
      const sliderValue = parseInt(event.target.value);
      const targetBallCount = this.sliderValueToBallCount(sliderValue);
      this.adjustBallCount(targetBallCount);
      display.textContent = targetBallCount;
    });
  }
  
  setupBallSizeSlider() {
    const slider = this.get('#ballSizeSlider');
    const display = this.get('#ballSizeDisplay');
    
    if (!slider || !display) return;
    
    // Set initial value
    slider.value = this.ballSize;
    display.textContent = this.ballSize;
    
    // Handle slider changes
    slider.addEventListener('input', (event) => {
      this.ballSize = parseInt(event.target.value);
      display.textContent = this.ballSize;
    });
  }
  
  setupTempScaleSlider() {
    const slider = this.get('#tempScaleSlider');
    const display = this.get('#tempScaleDisplay');
    
    if (!slider || !display) return;
    
    // Configure slider for logarithmic scale (0-100 maps to 1-1000 exponentially)
    slider.min = 0;
    slider.max = 100;
    slider.step = 1;
    
    // Set initial value (convert from temp scale to slider position)
    slider.value = this.tempScaleToSliderValue(this.temperatureScale);
    display.textContent = this.temperatureScale.toFixed(1);
    
    // Handle slider changes
    slider.addEventListener('input', (event) => {
      const sliderValue = parseInt(event.target.value);
      this.temperatureScale = this.sliderValueToTempScale(sliderValue);
      display.textContent = this.temperatureScale.toFixed(1);
    });
  }
  
  setupCoolingSlider() {
    const slider = this.get('#coolingSlider');
    const display = this.get('#coolingDisplay');
    
    if (!slider || !display) return;
    
    // Set initial value
    slider.value = this.coolingRate;
    display.textContent = this.coolingRate.toFixed(4);
    
    // Handle slider changes
    slider.addEventListener('input', (event) => {
      this.coolingRate = parseFloat(event.target.value);
      display.textContent = this.coolingRate.toFixed(4);
    });
  }
  
  // Convert temperature scale to logarithmic slider value (0-100)
  tempScaleToSliderValue(tempScale) {
    if (tempScale <= 1) return 0;
    if (tempScale >= 1000) return 100;
    // Logarithmic mapping: tempScale = 10^(sliderValue/50 * 3)
    // Inverse: sliderValue = (log10(tempScale) / 3) * 50
    return Math.round((Math.log10(tempScale) / 3) * 100);
  }
  
  // Convert logarithmic slider value (0-100) to temperature scale
  sliderValueToTempScale(sliderValue) {
    if (sliderValue <= 0) return 1;
    if (sliderValue >= 100) return 1000;
    // Exponential mapping: tempScale = 10^(sliderValue/100 * 3)
    return Math.round(Math.pow(10, (sliderValue / 100) * 3));
  }
  
  // Convert ball count to logarithmic slider value (0-100)
  ballCountToSliderValue(ballCount) {
    if (ballCount <= 0) return 0;
    if (ballCount >= 10000) return 100;
    // Logarithmic mapping: ballCount = (e^(sliderValue/25) - 1) * (10000/147.4)
    // Inverse: sliderValue = 25 * ln((ballCount * 147.4/10000) + 1)
    return Math.round(25 * Math.log((ballCount * 147.4 / 10000) + 1));
  }
  
  // Convert logarithmic slider value (0-100) to ball count
  sliderValueToBallCount(sliderValue) {
    if (sliderValue <= 0) return 0;
    if (sliderValue >= 100) return 10000;
    // Exponential mapping: ballCount = (e^(sliderValue/25) - 1) * (10000/147.4)
    return Math.round((Math.exp(sliderValue / 25) - 1) * (10000 / 147.4));
  }
  
  updateBallsSlider() {
    const slider = this.get('#ballsSlider');
    const display = this.get('#ballsDisplay');
    
    if (slider && display) {
      slider.value = this.ballCountToSliderValue(this.balls.length);
      display.textContent = this.balls.length;
    }
  }
  
  adjustBallCount(targetCount) {
    const currentCount = this.balls.length;
    
    if (targetCount > currentCount) {
      // Add balls
      for (let i = currentCount; i < targetCount; i++) {
        this.addBall();
      }
    } else if (targetCount < currentCount) {
      // Remove balls
      const ballsToRemove = currentCount - targetCount;
      for (let i = 0; i < ballsToRemove; i++) {
        this.removeBall();
      }
    }
  }

  // this.addBall()
  addBall() {
    const canvas = this.get("#bouncing-ball");
    
    // Use canvas dimensions if available, otherwise use default dimensions
    const width = canvas ? (canvas.width || 400) : 400;
    const height = canvas ? (canvas.height || 300) : 300;
    
    console.log(`[addBall] Canvas: ${canvas ? 'found' : 'not found'}, dimensions: ${width}x${height}, balls count: ${this.balls.length}`);
    
    // Create balls randomly distributed across the area
    // Ensure we have minimum area for ball placement
    const ballSize = this.ballSize || 5; // Fallback if ballSize not set
    const minWidth = Math.max(width, 4 * ballSize);
    const minHeight = Math.max(height, 4 * ballSize);
    
    const x = ballSize + Math.random() * (minWidth - 2 * ballSize);
    const y = ballSize + Math.random() * (minHeight - 2 * ballSize);
    
    const ball = {
      dx: 0.3 + 0.6 * Math.random(), // Ensure minimum velocity of 0.3
      dy: 0.3 + 0.6 * Math.random(), // Ensure minimum velocity of 0.3
      y: y, 
      x: x, 
      collisionAnimation: 30, 
      collisionType: 'create', 
      originalColor: [128, 128, 128]
    };
    
    console.log(`[addBall] Created ball at: ${x}, ${y} with velocity: ${ball.dx}, ${ball.dy}`);
    this.balls.push(ball);
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
    
    // Get the container size (which holds the canvas)
    const container = this.get("#container");
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    
    // Use container's actual size minus padding
    const newWidth = Math.max(300, containerRect.width - 20);
    const newHeight = Math.max(200, containerRect.height - 20);
    
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

  // Store balls, speed, friction, ball size, temperature scale, and cooling rate to attributes before save
  livelyPrepareSave() {
    this.setAttribute("data-speed", this.speedMultiplier);
    this.setAttribute("data-friction", this.frictionFactor);
    this.setAttribute("data-ballsize", this.ballSize);
    this.setAttribute("data-tempscale", this.temperatureScale);
    this.setAttribute("data-cooling", this.coolingRate);
    this.setAttribute("data-balls", JSON.stringify(this.balls));
  }

  // lively mirgrate is executed after constructor, but before initializer #Design?
  livelyMigrate(oldInstance) {
    if (oldInstance.balls)
       this.balls = oldInstance.balls
    if (oldInstance.hits)
       this.hits = oldInstance.hits
    if (oldInstance.speedMultiplier)
       this.speedMultiplier = oldInstance.speedMultiplier
    if (oldInstance.frictionFactor)
       this.frictionFactor = oldInstance.frictionFactor
    if (oldInstance.ballSize)
       this.ballSize = oldInstance.ballSize
    if (oldInstance.temperatureScale)
       this.temperatureScale = oldInstance.temperatureScale
    if (oldInstance.coolingRate)
       this.coolingRate = oldInstance.coolingRate
  }
}