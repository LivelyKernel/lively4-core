# 3D Treemap Architecture Visualization Demo

Interactive 3D treemap showing class architecture with:
- **Weight (area)**: Lines of code
- **Height**: Number of methods
- **Color**: Lines of code (viridis color scheme)

<script>
// Create class diagram with 3D treemap renderer
const diagram = await lively.create('lively-class-diagram');
diagram.style.width = '100%';
diagram.style.height = '800px';

// Set to 3D treemap renderer
await diagram.setRenderer('treemap3d');

// Add some classes to visualize
// Try the architecture-view components themselves!
await diagram.addPath('src/architecture-view/components/');

diagram
</script>

## Controls

- **Right-click**: Switch between renderers (Mermaid, Polymetric, 2D Treemap, 3D Treemap)
- **Click a class**: Opens the source file in browser
- **Mouse**: Navigate the 3D scene

## Try Different Paths

```javascript
// AI workspace components
await diagram.clear();
await diagram.addPath('src/ai-workspace/components/');
```

```javascript
// Literature components
await diagram.clear();
await diagram.addPath('src/components/literature/');
```

```javascript
// All tools
await diagram.clear();
await diagram.addPath('src/components/tools/');
```
