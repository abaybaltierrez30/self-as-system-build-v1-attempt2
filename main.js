// main.js - Un, Deux, Trois (Generative Artistry) recreation
// Seeded, layered vertical-line sketch inspired by the tutorial

var canvas = document.querySelector('canvas');
var context = canvas.getContext('2d');

function resizeAndSetup() {
  var size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
  var dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  canvas.style.width = Math.round(size) + 'px';
  canvas.style.height = Math.round(size) + 'px';
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return size;
}

// simple seeded RNG (mulberry32)
function createRng(seed) {
  seed = seed >>> 0;
  return function() {
    seed += 0x6D2B79F5;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function drawLineInCell(x, y, w, h, px, strokeWidth, color, alpha) {
  context.save();
  context.translate(x, y);
  context.beginPath();
  context.moveTo(px, 0);
  context.lineTo(px, h);
  context.lineWidth = strokeWidth;
  context.strokeStyle = color;
  context.globalAlpha = alpha;
  context.stroke();
  context.restore();
}

function unDeuxTrois(opts) {
  var seed = opts.seed || Math.floor(Math.random() * 1e9);
  var rng = createRng(seed);
  var layers = opts.layers || 24;
  var step = opts.step || 28;
  var jitter = opts.jitter || 0.18; // fraction of cell width
  var widthFactor = opts.widthFactor || 1.0;
  var size = resizeAndSetup();
  context.clearRect(0, 0, size, size);

  var aThird = size / 3;

  for (var layer = 0; layer < layers; layer++) {
    // subtle offset and low alpha per layer to build texture
    var layerOffsetX = (rng() - 0.5) * step * 0.4;
    var layerOffsetY = (rng() - 0.5) * step * 0.4;
    var layerAlpha = 0.06 + rng() * 0.06; // 0.06-0.12

    context.save();
    context.translate(layerOffsetX, layerOffsetY);

    for (var y = 0; y < size; y += step) {
      for (var x = 0; x < size; x += step) {
        var positions, baseColor;
        if (y < aThird) {
          positions = [0.5];
          baseColor = '#111111';
        } else if (y < aThird * 2) {
          positions = [0.33, 0.66];
          baseColor = '#c0392b';
        } else {
          positions = [0.2, 0.5, 0.8];
          baseColor = '#2980b9';
        }

        // per-cell random transform
        context.save();
        var cx = x + step / 2;
        var cy = y + step / 2;
        context.translate(cx, cy);
        context.rotate((rng() - 0.5) * 0.25);
        context.translate(-cx, -cy);

        for (var i = 0; i < positions.length; i++) {
          var pos = positions[i];
          // jitter position within cell
          var px = x + (pos + (rng() - 0.5) * jitter) * step;
          var strokeW = (1 + rng() * 2) * widthFactor;
          // slight color variation by mixing with white a bit
          var color = baseColor;
          drawLineInCell(x, y, step, step, px - x, strokeW, color, layerAlpha);
        }

        context.restore();
      }
    }

    context.restore();
  }

  // draw a few crisp top passes for definition
  for (var t = 0; t < 3; t++) {
    var crispAlpha = 0.35 - t * 0.1;
    for (var y2 = 0; y2 < size; y2 += step) {
      for (var x2 = 0; x2 < size; x2 += step) {
        var positions2;
        if (y2 < aThird) positions2 = [0.5];
        else if (y2 < aThird * 2) positions2 = [0.33, 0.66];
        else positions2 = [0.2, 0.5, 0.8];

        for (var j = 0; j < positions2.length; j++) {
          var px2 = x2 + positions2[j] * step;
          drawLineInCell(x2, y2, step, step, px2 - x2, 1 + t, '#111111', crispAlpha);
        }
      }
    }
  }

  // return seed used so user can reproduce
  return seed;
}

function render() {
  // read seed from URL if present
  var params = new URLSearchParams(location.search);
  var seed = params.has('seed') ? parseInt(params.get('seed'), 10) : undefined;
  var used = unDeuxTrois({ seed: seed, layers: 28, step: 28, jitter: 0.18, widthFactor: 1.2 });
  // expose used seed to console
  console.log('un-deux-trois seed:', used);
}

window.addEventListener('resize', render);
window.addEventListener('load', render);

// export for testing in Node or console if needed
try { module.exports = { unDeuxTrois, render }; } catch (e) {}
