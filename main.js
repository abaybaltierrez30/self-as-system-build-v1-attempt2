// main.js - browser sketch for Visual-Rule-Test (Generative Artistry: Un Deux Trois)

var canvas = document.querySelector('canvas');
var context = canvas.getContext('2d');
function resizeAndSetup() {
  var size = Math.min(window.innerWidth, window.innerHeight) * 0.9; // keep some margin
  var dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  canvas.style.width = Math.round(size) + 'px';
  canvas.style.height = Math.round(size) + 'px';
  // Use setTransform to avoid accumulating scales on resize
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return size;
}

context.lineWidth = 2;
context.lineCap = 'round';

function draw(x, y, width, height, positions) {
  context.save();
  context.translate(x, y);

  for (var i = 0; i < positions.length; i++) {
    context.beginPath();
    context.moveTo(positions[i] * width, 0);
    context.lineTo(positions[i] * width, height);
    context.stroke();
  }

  context.restore();
}

function render() {
  var size = resizeAndSetup();
  context.clearRect(0, 0, size, size);

  var step = 20;
  var aThirdOfHeight = size / 3;

  // draw a grid of small cells, choosing positions by vertical band
  for (var y = 0; y < size; y += step) {
    for (var x = 0; x < size; x += step) {
      var positions;
      if (y < aThirdOfHeight) {
        positions = [0.5];
        context.strokeStyle = '#111';
      } else if (y < aThirdOfHeight * 2) {
        positions = [0.2, 0.8];
        context.strokeStyle = '#c0392b';
      } else {
        positions = [0.1, 0.5, 0.9];
        context.strokeStyle = '#2980b9';
      }

      context.save();
      // small random rotation/offset per cell for variety
      context.translate(x + step / 2, y + step / 2);
      context.rotate((Math.random() - 0.5) * 0.4);
      context.translate(-step / 2, -step / 2);

      draw(0, 0, step, step, positions);

      context.restore();
    }
  }
}

window.addEventListener('resize', render);
window.addEventListener('load', render);

// export for testing in Node or console if needed
try { module.exports = { draw, render }; } catch (e) {}