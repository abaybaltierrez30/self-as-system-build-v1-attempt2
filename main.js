// main.js - browser sketch for Visual-Rule-Test (Generative Artistry: Un Deux Trois)

var canvas = document.querySelector('canvas');
var context = canvas.getContext('2d');

function resizeAndSetup() {
  var size = Math.min(window.innerWidth, window.innerHeight) * 0.9; // keep some margin
  var dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  // Use setTransform to avoid accumulating scales on resize
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return size;
}

context.lineWidth = 4;
context.lineCap = 'round';

function draw(x, y, width, height, positions) {
  context.save();
  context.translate(x, y);

  // fixed: iterate only over valid indices
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

  // Three columns (un, deux, trois)
  var colW = size / 3;

  context.strokeStyle = '#111';
  draw(0, 0, colW, size, [0.25, 0.5, 0.75]);

  context.strokeStyle = '#c0392b';
  draw(colW, 0, colW, size, [0.33, 0.66]);

  context.strokeStyle = '#2980b9';
  draw(colW * 2, 0, colW, size, [0.2, 0.4, 0.6, 0.8]);
}

window.addEventListener('resize', render);
window.addEventListener('load', render);

// export for testing in Node or console if needed
try { module.exports = { draw, render }; } catch (e) {}