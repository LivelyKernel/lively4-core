# Shadama

Shadama is designed for writing programs that create, control and visualize large numbers of objects.

## Properties

- Programs are run on the GPU by means of code translation to the OpenGL Shading Language.
- Coding environment supports liveness (live programming).
- Built on web technologies (WebGL 2.0 and OpenGL Shading Language version 3.0).
- Only supports 2D particle simulations.

## Language

Shadama has its own programming language that has similarities to Javascript and is inspired from [StarLogo](https://en.wikipedia.org/wiki/StarLogo).

### Static functions

See [01-static-functions.shadama](01-static-functions.shadama)

### Breed + Methods

See [02-breed-and-methods.shadama](02-breed-and-methods.shadama)

### Patch

See [03-patch.shadama](03-patch.shadama)

### Variables

#### Local variables

- The `var` statement declares a local variable within a method.
- The scope of a local variable is the whole method, regardless of where in the method it is declared.
-  In the same method, there can be no more than one declaration for a given variable name.

Example:
```
def average() {
  var avg = (this.x + this.y) / 2.0;
  this.x = avg;
  this.y = avg;
}
```

#### Static function variables

- The `var` statement declares a static function variable within a static function.
- Static function variables are not available to methods, but are visible to all static functions.
- There can be no more than one declaration for a given variable name.

Example:
```
static setup() {
  var begin = 1;
}

static loop() {
  if (begin) {
    begin = 0;
  }
}
```

Shadama provides the following built-in static function variables:

- `mousemove`: An object whose x and y properties refer to the most recent mouse cursor location.
- `mousedown`: An object whose x and y properties refer to the most recent location where the user pressed the mouse button down.
- `mouseup`: An object whose x and y properties refer to the most recent location where the user lifted the mouse button up.
- `time`: The number of seconds elapsed since the last time the setup function was called (in floating-point).
- `width`, `height`: The width and height of the Shadama canvas.
- `Display`: An object to invoke certain system primitives such as `Display.clear()` and `Display.loadProgram()`.

Be aware that mouse event objects and `Display` are JavaScript objects. Thus, they can't be passed to methods because methods can only take scalar arguments.

### Control structures

The `if` statement is the only control structure that Shadama supports.

Example:
```
static loop() {
  if (time > 5.0) {necenecessary
    // Do something if time is higher than 5.0
  }
  else{
    // Do something if time is lower or equal 5.0
  }
}
```


### Primitive functions

There are a number of primitive functions that can be called from methods. Most of them actually result in a direct call to a GLSL built-in function. For example:

```
def prims(x) {
  var c = cos(x);
  var s = step(0.5, x);
  var a = abs(x);
  var f = fract(x); // the fraction part of x

  this.r = c * s * a * f;
}
```

The above code uses several primitive functions to compute a contrived value which is then stored into the turtle's `r` property.

###  Parallelism

It's possible for two or more nearby turtles to write into the same patch cell. Which value gets stored in the patch is non-deterministic.

Also, updates to turtle properties and patch properties are not visible until after the method is run. Consider the following method:

```
def test() {
  if (this.r > 0) {
     this.r = 0;
  } else {
     this.r = 1;
  }
  this.b = this.r;
}
```

Even though the last line reads `this.b = this.r;`, the `r` property and `b` property will not be equal after the invocation. This is because the update to the `r` property seen earlier does not take effect until after the method call is finished.

## Examples

### Moving particles

In this example, the particles move in the canvas and bounce on the canvas borders.


See [04-moving-particles.shadama](04-moving-particles.shadama)

### Persistent smell

This example shows how it is possible that particles interfere with their surroundings through the use of patches.
Therefore the particles access the nearest cell of a patch during the movement and change its state.

See [05-persistent-smell.shadama](05-persistent-smell.shadama)

### Non persistent smell

In this examples, the smell decays over time. The examples show two different possible ways to implement this behavior.
In both examples it is necessary to access all cells of a patch to implement the decay.
Therefore, you can use a helper breed that covers the whole canvas and does not move.

Example code to access all cells of a patch:

```
// Helper to access all cells
breed AllCells (x, y)
patch Field (r, g, b, a)
  
static setup() {
  AllCells.fillSpace("x", "y", width, height);
  loop.start();
}

static loop() {
  AllCells.decay(Field);
}
```

#### Decrement-based

In this example, the smell decays by decrementing it by a certain amount on every tick.

See [06a-nonpersistent-smell-decrementbased.shadama](06a-nonpersistent-smell-decrementbased.shadama)

#### Time-based

In this example, the smell decays by using the time variable to calculate the elapsed time of a smell.

See [06b-nonpersistent-smell-timebased.shadama](06b-nonpersistent-smell-timebased.shadama)


### Disease distribution

This example combines multiple concepts and features of Shadama to show an interesting simulation.
The simulation shows the distribution of a disease in which particles represent humans.

Characteristics of the simulation:

- The humans move and have a property for their immunity.
- A human can be infected or healthy. In the beginning a certain amount is infected.
- Infected humans spread pathogens.
- A healthy human can be infected based on the pathogen concentration and the immunity of the human.
- An infected human heals over time and becomes healthy again.
- The immunity of a human increases when healed.
- Over time the immunity and pathogen concentration decreases.

See [07-disease-distribution.shadama](07-disease-distribution.shadama)

## Ideas to improve Shadama

- Simplify access to all fields
- Add support for constants
- Add support for adjustable variables using UI (e.g. slider)
- Modulo on non static functions is not implemented
- Random function inside methods is not documented and behaves oddly
- Support keyboard input, this probably allow us to develop a game like snake

* * *

This is a summary of [/~ohshima/shadama2/live2017](http://tinlizzie.org/~ohshima/shadama2/live2017/) with additional info and samples.
