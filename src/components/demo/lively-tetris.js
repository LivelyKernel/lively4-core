"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyTetris extends Morph {
  async initialize() {
    this.windowTitle = "Tetris";
    
    // Canvas holen
    this.canvas = this.get("#gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    
    // Spielfeld-Größe
    this.blockSize = 30; // Pixel pro Block
    this.cols = 10;      // 10 Spalten
    this.rows = 20;      // 20 Zeilen
    
    // Alle Tetromino-Formen definieren
    this.tetrominoes = [
      {
        name: "I",
        shape: [
          [1, 1, 1, 1]
        ],
        color: "cyan"
      },
      {
        name: "O",
        shape: [
          [1, 1],
          [1, 1]
        ],
        color: "yellow"
      },
      {
        name: "T",
        shape: [
          [0, 1, 0],
          [1, 1, 1]
        ],
        color: "purple"
      },
      {
        name: "L",
        shape: [
          [0, 0, 1],
          [1, 1, 1]
        ],
        color: "orange"
      },
      {
        name: "J",
        shape: [
          [1, 0, 0],
          [1, 1, 1]
        ],
        color: "blue"
      },
      {
        name: "S",
        shape: [
          [0, 1, 1],
          [1, 1, 0]
        ],
        color: "green"
      },
      {
        name: "Z",
        shape: [
          [1, 1, 0],
          [0, 1, 1]
        ],
        color: "red"
      }
    ];
    
    // Spielfeld für abgelegte Blöcke (2D-Array)
    this.grid = [];
    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = null;  // null = leer
      }
    }
    
    // Punktestand und Level
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.isPaused = false;
    this.gameStarted = false;
    
    // High Score aus localStorage laden
    this.loadHighScore();
    
    this.updateScore();
    
    // Ersten Block erstellen
    this.spawnNewBlock();
    
    // Tastatur-Steuerung aktivieren
    lively.html.registerKeys(this);
    
    // Spielfeld zeichnen
    this.draw();
    
    // NICHT automatisch starten - warten auf ersten Tastendruck
  }
  
  startGame() {
    // WICHTIG: Alten Timer definitiv stoppen um Bug zu vermeiden
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    
    // Geschwindigkeit berechnen: Je höher das Level, desto schneller
    // Level 1: 500ms, Level 2: 450ms, Level 3: 400ms, etc.
    let speed = Math.max(100, 550 - (this.level * 50));
    
    // Sicherstellen dass wirklich kein alter Timer mehr läuft
    setTimeout(() => {
      // Timer mit aktueller Geschwindigkeit starten
      this.gameInterval = setInterval(() => {
        this.gameStep();
      }, speed);
    }, 50);
  }
  
  gameOver() {
    // Timer stoppen
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    
    this.gameStarted = false;
    
    // Game Over anzeigen
    lively.notify("Game Over! Spiel startet neu...");
    
    // Nach 2 Sekunden neu starten
    setTimeout(() => {
      this.restartGame();
    }, 2000);
  }
  
  restartGame() {
    // Timer stoppen
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    
    // Spielfeld leeren
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = null;
      }
    }
    
    // Alles zurücksetzen
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.isPaused = false;
    this.gameStarted = false;
    this.updateScore();
    
    // Neuen Block spawnen
    this.spawnNewBlock();
    
    // Zeichnen
    this.draw();
    
    // NICHT automatisch starten - warten auf Tastendruck
  }
  
  gameStep() {
    // Wenn pausiert, nichts tun
    if (this.isPaused) {
      return;
    }
    
    // Versuche Block nach unten zu bewegen
    if (this.isValidPosition(this.currentBlock.x, this.currentBlock.y + 1)) {
      this.currentBlock.y++;
      this.draw();
    } else {
      // Block ist unten angekommen - ablegen
      this.lockBlock();
      
      // Volle Zeilen entfernen
      this.clearFullRows();
      
      // Neuen Block spawnen
      this.spawnNewBlock();
      
      // Prüfen ob neuer Block platziert werden kann
      if (!this.isValidPosition(this.currentBlock.x, this.currentBlock.y)) {
        // Game Over!
        this.gameOver();
      } else {
        this.draw();
      }
    }
  }
  
  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      lively.notify("Pause - Leertaste zum Fortsetzen");
    } else {
      lively.notify("Spiel läuft weiter");
    }
    
    this.draw();
  }
  
  spawnNewBlock() {
    // Zufälligen Tetromino auswählen
    let randomIndex = Math.floor(Math.random() * this.tetrominoes.length);
    let tetromino = this.tetrominoes[randomIndex];
    
    // Neuen Block erstellen
    this.currentBlock = {
      x: 4,  // Mitte
      y: 0,  // Oben
      shape: tetromino.shape,
      color: tetromino.color
    };
  }
  
  lockBlock() {
    // Aktuellen Block ins Spielfeld übertragen
    let shape = this.currentBlock.shape;
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          let gridRow = this.currentBlock.y + row;
          let gridCol = this.currentBlock.x + col;
          
          // Farbe im grid speichern
          this.grid[gridRow][gridCol] = this.currentBlock.color;
        }
      }
    }
  }
  
  clearFullRows() {
    let rowsCleared = 0;
    
    // Von unten nach oben durchgehen
    for (let row = this.rows - 1; row >= 0; row--) {
      // Prüfen ob Zeile voll ist
      let isFull = true;
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col] === null) {
          isFull = false;
          break;
        }
      }
      
      // Wenn Zeile voll ist, entfernen
      if (isFull) {
        // Zeile entfernen
        this.grid.splice(row, 1);
        
        // Neue leere Zeile oben hinzufügen
        let emptyRow = [];
        for (let col = 0; col < this.cols; col++) {
          emptyRow.push(null);
        }
        this.grid.unshift(emptyRow);
        
        rowsCleared++;
        
        // Gleiche Zeile nochmal prüfen (da neue Zeile runtergerutscht ist)
        row++;
      }
    }
    
    if (rowsCleared > 0) {
      // Punkte vergeben: 1 Zeile = 100, 2 Zeilen = 300, 3 Zeilen = 500, 4 Zeilen = 800
      let points = [0, 100, 300, 500, 800];
      this.score += points[rowsCleared] || rowsCleared * 100;
      this.linesCleared += rowsCleared;
      
      // Level erhöhen alle 5 gelöschten Zeilen
      let newLevel = Math.floor(this.linesCleared / 5) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        lively.notify(`Level ${this.level}! Schneller!`);
        // Spiel mit neuer Geschwindigkeit neu starten
        this.startGame();
      }
      
      this.updateScore();
      
      lively.notify(`${rowsCleared} Zeile(n) entfernt! +${points[rowsCleared]} Punkte`);
    }
  }
  
  updateScore() {
    let scoreElement = this.get("#score");
    if (scoreElement) {
      scoreElement.textContent = `Punkte: ${this.score} | Level: ${this.level}`;
    }
    
    let highScoreElement = this.get("#highScore");
    if (highScoreElement) {
      highScoreElement.textContent = `High Score: ${this.highScore}`;
    }
    
    // High Score aktualisieren wenn aktueller Score höher ist
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      // Optionale Benachrichtigung bei neuem High Score
      if (this.score > 0) {
        lively.notify(`🏆 Neuer High Score: ${this.highScore}!`);
      }
    }
  }
  
  loadHighScore() {
    // High Score aus localStorage laden (Standard: 0)
    let stored = localStorage.getItem('tetris-highscore');
    this.highScore = stored ? parseInt(stored) : 0;
  }
  
  saveHighScore() {
    // High Score in localStorage speichern
    localStorage.setItem('tetris-highscore', this.highScore.toString());
  }
  
  draw() {
    // Hintergrund löschen
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Raster zeichnen
    this.drawGrid();
    
    // Abgelegte Blöcke zeichnen
    this.drawLockedBlocks();
    
    // Aktuellen Block zeichnen
    this.drawBlock();
    
    // Wenn noch nicht gestartet, Hinweis anzeigen
    if (!this.gameStarted) {
      this.drawStartText();
    }
    
    // Wenn pausiert, "PAUSE" anzeigen
    if (this.isPaused) {
      this.drawPauseText();
    }
  }
  
  drawStartText() {
    // Halbtransparenter Hintergrund
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // "START" Text
    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 35px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("Drücke eine Taste", this.canvas.width / 2, this.canvas.height / 2);
    
    // Kleiner Text darunter
    this.ctx.font = "20px Arial";
    this.ctx.fillText("um zu starten", this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  drawPauseText() {
    // Halbtransparenter Hintergrund
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // "PAUSE" Text
    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 40px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("PAUSE", this.canvas.width / 2, this.canvas.height / 2);
    
    // Kleiner Text darunter
    this.ctx.font = "20px Arial";
    this.ctx.fillText("Leertaste drücken", this.canvas.width / 2, this.canvas.height / 2 + 50);
  }
  
  drawLockedBlocks() {
    // Durch das grid gehen und alle abgelegten Blöcke zeichnen
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        let color = this.grid[row][col];
        
        if (color) {
          // Position berechnen
          let x = col * this.blockSize;
          let y = row * this.blockSize;
          
          // Rechteck zeichnen
          this.ctx.fillStyle = color;
          this.ctx.fillRect(x, y, this.blockSize, this.blockSize);
          
          // Rand zeichnen
          this.ctx.strokeStyle = "black";
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x, y, this.blockSize, this.blockSize);
        }
      }
    }
  }
  
  drawGrid() {
    // Rasterlinien zeichnen
    this.ctx.strokeStyle = "#ccc";
    this.ctx.lineWidth = 1;
    
    // Vertikale Linien
    for (let col = 0; col <= this.cols; col++) {
      let x = col * this.blockSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.rows * this.blockSize);
      this.ctx.stroke();
    }
    
    // Horizontale Linien
    for (let row = 0; row <= this.rows; row++) {
      let y = row * this.blockSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.cols * this.blockSize, y);
      this.ctx.stroke();
    }
  }
  
  drawBlock() {
    // Block-Form durchgehen
    let shape = this.currentBlock.shape;
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          // Position berechnen
          let x = (this.currentBlock.x + col) * this.blockSize;
          let y = (this.currentBlock.y + row) * this.blockSize;
          
          // Rechteck zeichnen
          this.ctx.fillStyle = this.currentBlock.color;
          this.ctx.fillRect(x, y, this.blockSize, this.blockSize);
          
          // Rand zeichnen
          this.ctx.strokeStyle = "black";
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x, y, this.blockSize, this.blockSize);
        }
      }
    }
  }
  
  onKeyDown(evt) {
    // Bei erstem Tastendruck Spiel starten
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.startGame();
      lively.notify("Spiel gestartet!");
    }
    
    // Leertaste für Pause
    if (evt.key === " ") {
      this.togglePause();
      evt.preventDefault();
      return;
    }
    
    // Wenn pausiert, keine Steuerung
    if (this.isPaused) {
      return;
    }
    
    // Pfeiltasten abfangen
    if (evt.key === "ArrowLeft") {
      this.moveBlock(-1, 0);  // Nach links
      evt.preventDefault();
    } else if (evt.key === "ArrowRight") {
      this.moveBlock(1, 0);   // Nach rechts
      evt.preventDefault();
    } else if (evt.key === "ArrowDown") {
      this.moveBlock(0, 1);   // Nach unten
      evt.preventDefault();
    } else if (evt.key === "ArrowUp") {
      this.rotateBlock();     // Drehen
      evt.preventDefault();
    }
  }
  
  moveBlock(dx, dy) {
    // Neue Position berechnen
    let newX = this.currentBlock.x + dx;
    let newY = this.currentBlock.y + dy;
    
    // Prüfen ob Position gültig ist
    if (this.isValidPosition(newX, newY)) {
      this.currentBlock.x = newX;
      this.currentBlock.y = newY;
      this.draw();  // Neu zeichnen
    }
  }
  
  rotateBlock() {
    // Form um 90 Grad im Uhrzeigersinn drehen
    let oldShape = this.currentBlock.shape;
    let newShape = this.rotateShape(oldShape);
    
    // Prüfen ob gedrehte Form gültig ist
    let oldShapeBackup = this.currentBlock.shape;
    this.currentBlock.shape = newShape;
    
    if (this.isValidPosition(this.currentBlock.x, this.currentBlock.y)) {
      // Rotation ist gültig - behalten
      this.draw();
    } else {
      // Rotation nicht möglich - alte Form wiederherstellen
      this.currentBlock.shape = oldShapeBackup;
    }
  }
  
  rotateShape(shape) {
    // Matrix um 90 Grad im Uhrzeigersinn drehen
    let rows = shape.length;
    let cols = shape[0].length;
    
    // Neue Matrix erstellen
    let rotated = [];
    for (let col = 0; col < cols; col++) {
      rotated[col] = [];
      for (let row = 0; row < rows; row++) {
        // Von unten nach oben aus der alten Matrix lesen
        rotated[col][row] = shape[rows - 1 - row][col];
      }
    }
    
    return rotated;
  }
  
  isValidPosition(x, y) {
    let shape = this.currentBlock.shape;
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          let newCol = x + col;
          let newRow = y + row;
          
          // Außerhalb des Spielfelds?
          if (newCol < 0 || newCol >= this.cols || newRow >= this.rows) {
            return false;
          }
          
          // Kollidiert mit abgelegtem Block?
          if (newRow >= 0 && this.grid[newRow][newCol]) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  async livelyExample() {
  }
  
  disconnectedCallback() {
    // Timer stoppen wenn Komponente geschlossen wird
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
    }
  }
  
  
}