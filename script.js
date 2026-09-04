function createUnDeuxTroisSketch(canvas) {
  var context = canvas.getContext('2d');
  var pointer = { x: 0, y: 0, active: false };

  function resizeAndSetup() {
    var size = 320;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = Math.round(size) + 'px';
    canvas.style.height = Math.round(size) + 'px';
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return size;
  }

  function drawButton(x, y, w, h, highlighted) {
    var gradient = context.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, '#7b5ef7');
    gradient.addColorStop(1, '#ff7d6d');

    context.save();
    context.translate(x + w / 2, y + h / 2);
    context.rotate((Math.random() - 0.5) * 0.4);
    context.translate(-(x + w / 2), -(y + h / 2));

    context.beginPath();
    context.rect(x, y, w, h);

    if (highlighted) {
      context.shadowColor = 'rgba(255, 146, 118, 0.9)';
      context.shadowBlur = 14;
    } else {
      context.shadowColor = 'rgba(123, 94, 247, 0.15)';
      context.shadowBlur = 6;
    }

    context.fillStyle = gradient;
    context.fill();
    context.shadowBlur = 0;
    context.lineWidth = highlighted ? 2 : 1.5;
    context.strokeStyle = highlighted ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)';
    context.stroke();
    context.restore();
  }

  function render() {
    var size = resizeAndSetup();
    context.clearRect(0, 0, size, size);

    var step = 20;
    var aThirdOfHeight = size / 3;

    for (var y = 0; y < size; y += step) {
      for (var x = 0; x < size; x += step) {
        var positions;
        if (y < aThirdOfHeight) {
          positions = [0.5];
        } else if (y < aThirdOfHeight * 2) {
          positions = [0.2, 0.8];
        } else {
          positions = [0.1, 0.5, 0.9];
        }

        for (var i = 0; i < positions.length; i++) {
          var pos = positions[i];
          var buttonW = step * 0.18;
          var buttonH = step * 0.76;
          var buttonX = x + (pos * step) - buttonW * 0.5;
          var buttonY = y + (step - buttonH) * 0.5;
          var highlighted = pointer.active && pointer.x >= buttonX && pointer.x <= buttonX + buttonW && pointer.y >= buttonY && pointer.y <= buttonY + buttonH;

          drawButton(buttonX, buttonY, buttonW, buttonH, highlighted);
        }
      }
    }
  }

  canvas.addEventListener('pointermove', function (event) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * (320 / rect.width);
    pointer.y = (event.clientY - rect.top) * (320 / rect.height);
    pointer.active = true;
    render();
  });

  canvas.addEventListener('pointerleave', function () {
    pointer.active = false;
    render();
  });

  window.addEventListener('resize', render);
  render();
}

function createDisarraySketch(canvas, options) {
  options = options || {};

  var context = canvas.getContext('2d');
  var size = options.size || 320;
  var dpr = window.devicePixelRatio || 1;
  var squareSize = options.squareSize || 30;
  var randomDisplacement = options.randomDisplacement || 15;
  var rotateMultiplier = options.rotateMultiplier || 20;
  var offset = options.offset || 10;
  var interactionRadius = options.interactionRadius || 140;
  var maxDisplacement = options.maxDisplacement || 90;
  var nearbyScale = options.nearbyScale || 1;
  var strokeBoost = options.strokeBoost || 0;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.lineWidth = options.lineWidth || 2;

  var squares = [];
  var pointer = {
    x: size / 2,
    y: size / 2,
    active: false,
    disperse: false
  };

  function createSquare(i, j) {
    var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
    var baseRotation = j / size * Math.PI / 180 * plusOrMinus * Math.random() * rotateMultiplier;

    plusOrMinus = Math.random() < 0.5 ? -1 : 1;
    var baseTranslateX = j / size * plusOrMinus * Math.random() * randomDisplacement;
    var baseX = i + baseTranslateX + offset;
    var baseY = j + offset;

    return {
      baseX: baseX,
      baseY: baseY,
      x: baseX,
      y: baseY,
      rotation: baseRotation,
      baseRotation: baseRotation,
      clicked: false
    };
  }

  function buildSquares() {
    squares = [];

    for (var i = squareSize; i <= size - squareSize; i += squareSize) {
      for (var j = squareSize; j <= size - squareSize; j += squareSize) {
        squares.push(createSquare(i, j));
      }
    }
  }

  function getNearInfluence(square) {
    if (!pointer.active) {
      return 0;
    }

    var dx = square.baseX - pointer.x;
    var dy = square.baseY - pointer.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= interactionRadius) {
      return 0;
    }

    return 1 - distance / interactionRadius;
  }

  function drawSquare(square) {
    var influence = getNearInfluence(square);
    var drawSize = squareSize * (1 + influence * nearbyScale);
    var lineWidth = (options.lineWidth || 2) + influence * strokeBoost;

    context.save();
    context.translate(square.x, square.y);
    context.rotate(square.rotation);
    context.lineWidth = lineWidth;
    context.beginPath();
    context.rect(-drawSize / 2, -drawSize / 2, drawSize, drawSize);
    context.stroke();
    context.restore();
  }

  function pointInSquare(px, py, square) {
    var dx = px - square.x;
    var dy = py - square.y;
    var cos = Math.cos(-square.rotation);
    var sin = Math.sin(-square.rotation);
    var localX = dx * cos - dy * sin;
    var localY = dx * sin + dy * cos;
    var targetSize = squareSize * (1 + getNearInfluence(square) * nearbyScale);

    return Math.abs(localX) <= targetSize / 2 && Math.abs(localY) <= targetSize / 2;
  }

  function getPointerPosition(event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (size / rect.width),
      y: (event.clientY - rect.top) * (size / rect.height)
    };
  }

  function updateSquares() {
    for (var i = 0; i < squares.length; i++) {
      var square = squares[i];

      if (square.clicked) {
        square.x += (square.baseX - square.x) * 0.18;
        square.y += (square.baseY - square.y) * 0.18;
        square.rotation += (square.baseRotation - square.rotation) * 0.18;

        if (Math.abs(square.x - square.baseX) < 0.1 && Math.abs(square.y - square.baseY) < 0.1) {
          square.clicked = false;
        }
        continue;
      }

      if (pointer.disperse) {
        var dx = square.baseX - pointer.x;
        var dy = square.baseY - pointer.y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < interactionRadius) {
          var force = (1 - distance / interactionRadius) * maxDisplacement;
          var angle = Math.atan2(dy, dx);
          var pushX = Math.cos(angle) * force;
          var pushY = Math.sin(angle) * force;

          square.x += (square.baseX + pushX - square.x) * 0.35;
          square.y += (square.baseY + pushY - square.y) * 0.35;
          square.rotation += (square.baseRotation + force * 0.02 - square.rotation) * 0.4;
          continue;
        }
      }

      square.x += (square.baseX - square.x) * 0.08;
      square.y += (square.baseY - square.y) * 0.08;
      square.rotation += (square.baseRotation - square.rotation) * 0.08;
    }

    if (pointer.disperse) {
      pointer.disperse = false;
    }
  }

  function render() {
    context.clearRect(0, 0, size, size);
    updateSquares();

    for (var i = 0; i < squares.length; i++) {
      drawSquare(squares[i]);
    }

    if (running) {
      animationId = requestAnimationFrame(render);
    }
  }

  function handlePointerMove(event) {
    var pt = getPointerPosition(event);
    pointer.x = pt.x;
    pointer.y = pt.y;
    pointer.active = true;
  }

  function handlePointerLeave() {
    pointer.active = false;
    pointer.disperse = false;
  }

  function handleClick(event) {
    var pt = getPointerPosition(event);
    pointer.x = pt.x;
    pointer.y = pt.y;
    pointer.active = true;
    pointer.disperse = true;

    for (var i = squares.length - 1; i >= 0; i--) {
      if (pointInSquare(pt.x, pt.y, squares[i])) {
        squares[i].clicked = true;
        return;
      }
    }
  }

  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerleave', handlePointerLeave);
  canvas.addEventListener('click', handleClick);
  buildSquares();

  var running = true;
  var animationId = null;

  function start() {
    if (!running) {
      running = true;
      render();
    }
  }

  function stop() {
    running = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  var controller = {
    pause: stop,
    resume: start,
    updateOptions: function (newOpts) {
      if (newOpts.squareSize != null) squareSize = newOpts.squareSize;
      if (newOpts.randomDisplacement != null) randomDisplacement = newOpts.randomDisplacement;
      if (newOpts.rotateMultiplier != null) rotateMultiplier = newOpts.rotateMultiplier;
      if (newOpts.offset != null) offset = newOpts.offset;
      if (newOpts.interactionRadius != null) interactionRadius = newOpts.interactionRadius;
      if (newOpts.maxDisplacement != null) maxDisplacement = newOpts.maxDisplacement;
      if (newOpts.nearbyScale != null) nearbyScale = newOpts.nearbyScale;
      if (newOpts.strokeBoost != null) strokeBoost = newOpts.strokeBoost;
      if (newOpts.lineWidth != null) context.lineWidth = newOpts.lineWidth;
      buildSquares();
    }
  };

  // start loop
  render();

  return controller;
}

window.Sketches = window.Sketches || {};
var el1 = document.getElementById('test-1');
var el2 = document.getElementById('test-2');
var el3 = document.getElementById('test-3');
if (el1) {
  window.Sketches.t1 = createUnDeuxTroisSketch(el1);
}
if (el2) {
  window.Sketches.t2 = createDisarraySketch(el2, {
    size: 320,
    squareSize: 30,
    randomDisplacement: 15,
    rotateMultiplier: 20,
    offset: 10,
    interactionRadius: 140,
    maxDisplacement: 90,
    lineWidth: 2
  });
}
if (el3) {
  window.Sketches.t3 = createDisarraySketch(el3, {
    size: 320,
    squareSize: 32,
    randomDisplacement: 18,
    rotateMultiplier: 24,
    offset: 12,
    interactionRadius: 180,
    maxDisplacement: 150,
    nearbyScale: 1.5,
    strokeBoost: 5,
    lineWidth: 2.4
  });
}

function createHoursOfDarkSketch(canvas) {
  var context = canvas.getContext('2d');
  var particles = [];
  var pointer = {
    x: 0,
    y: 0,
    active: false,
    burst: false
  };
  var animationFrame = null;

  function resizeAndSetup() {
    var size = 320;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return size;
  }

  function buildParticles(size) {
    particles = [];

    var gridw = size * 0.9;
    var gridh = size * 0.7;
    var margx = (size - gridw) * 0.5;
    var margy = (size - gridh) * 0.5;
    var innerLeft = margx;
    var innerTop = margy;
    var innerRight = size - margx;
    var innerBottom = size - margy;
    var borderBand = 18;
    var count = 60;

    for (var i = 0; i < count; i++) {
      var edge = Math.floor(Math.random() * 4);
      var x;
      var y;

      if (edge === 0) {
        x = Math.random() * size;
        y = Math.random() * borderBand + innerTop - borderBand;
      } else if (edge === 1) {
        x = innerRight + Math.random() * borderBand;
        y = Math.random() * size;
      } else if (edge === 2) {
        x = Math.random() * size;
        y = innerBottom + Math.random() * borderBand;
      } else {
        x = Math.random() * borderBand + innerLeft - borderBand;
        y = Math.random() * size;
      }

      x = Math.min(Math.max(x, 0), size);
      y = Math.min(Math.max(y, 0), size);

      particles.push({
        x: x,
        y: y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 1.2 + Math.random() * 1.8
      });
    }
  }

  function updateParticles(size) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var driftX = Math.sin((p.baseY + i) * 0.16) * 0.18;
      var driftY = Math.cos((p.baseX + i) * 0.15) * 0.18;

      p.vx += (p.baseX + driftX - p.x) * 0.06;
      p.vy += (p.baseY + driftY - p.y) * 0.06;

      if (pointer.active) {
        var dx = p.x - pointer.x;
        var dy = p.y - pointer.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var influenceRadius = pointer.burst ? 120 : 80;

        if (distance < influenceRadius) {
          var force = (1 - distance / influenceRadius) * (pointer.burst ? 1.5 : 0.55);
          p.vx += (dx / (distance || 1)) * force;
          p.vy += (dy / (distance || 1)) * force;
        }
      }

      p.vx *= 0.88;
      p.vy *= 0.88;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > size) {
        p.x = Math.min(Math.max(p.x, 0), size);
        p.vx *= -0.4;
      }

      if (p.y < 0 || p.y > size) {
        p.y = Math.min(Math.max(p.y, 0), size);
        p.vy *= -0.4;
      }
    }

    pointer.burst = false;
  }

  function drawParticles() {
    context.fillStyle = 'rgba(17, 17, 17, 0.06)';

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      context.beginPath();
      context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawCalendar(size) {
    var cols = 23;
    var rows = 16;
    var days = 365;

    var gridw = size * 0.9;
    var gridh = size * 0.7;
    var cellw = gridw / cols;
    var cellh = gridh / rows;
    var margx = (size - gridw) * 0.5;
    var margy = (size - gridh) * 0.5;

    for (var i = 0; i < days; i++) {
      var col = Math.floor(i / rows);
      var row = i % rows;

      var x = margx + col * cellw;
      var y = margy + row * cellh;
      var w = 2;
      var h = 30;

      context.save();
      context.translate(x, y);

      context.beginPath();
      context.rect(0, 0, cellw, cellh);
      context.clip();

      context.translate(cellw * 0.5, cellh * 0.5);

      var phi = (i / days) * Math.PI;
      var theta = Math.sin(phi) * Math.PI * 0.45 + 0.85;

      context.rotate(theta);

      var scale = Math.abs(Math.cos(phi)) * 2 + 1;
      context.scale(scale, 1);

      context.fillStyle = '#111';
      context.beginPath();
      context.rect(w * -0.5, h * -0.5, w, h);
      context.fill();

      context.restore();
    }
  }

  function render() {
    var size = resizeAndSetup();
    context.clearRect(0, 0, size, size);

    drawCalendar(size);
    updateParticles(size);
    drawParticles();

    if (running) {
      animationFrame = requestAnimationFrame(render);
    }
  }

  function handlePointerMove(event) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * (320 / rect.width);
    pointer.y = (event.clientY - rect.top) * (320 / rect.height);
    pointer.active = true;
  }

  function handlePointerLeave() {
    pointer.active = false;
    pointer.burst = false;
  }

  function handleClick(event) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * (320 / rect.width);
    pointer.y = (event.clientY - rect.top) * (320 / rect.height);
    pointer.active = true;
    pointer.burst = true;
  }

  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerleave', handlePointerLeave);
  canvas.addEventListener('click', handleClick);

  buildParticles(320);

  var running = true;
  var animationFrame = null;

  var controller = {
    pause: function () { running = false; },
    resume: function () { if (!running) { running = true; render(); } },
    burst: function () { pointer.burst = true; }
  };

  render();

  return controller;
}

function createWindowBackdrop(canvas, options) {
  options = options || {};
  var context = canvas.getContext('2d');
  var count = options.count || 10;
  var dpr = window.devicePixelRatio || 1;
  var particles = [];
  var time = 0;
  var burstTimer = 0;

  function resize() {
    var w = canvas.clientWidth || canvas.width;
    var h = canvas.clientHeight || canvas.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    context.setTransform(dpr,0,0,dpr,0,0);
  }

  function init() {
    resize();
    particles = [];
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        baseX: Math.random() * w,
        baseY: Math.random() * h,
        r: 18 + Math.random() * 36,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2
      });
    }
  }

  function draw() {
    resize();
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    context.clearRect(0,0,w,h);
    time += 0.016;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var j = i;
      p.vx += Math.cos((p.baseY + time * 6 + j) * 0.03) * 0.02;
      p.vy += Math.sin((p.baseX + time * 5 + j) * 0.03) * 0.02;
      p.x += p.vx;
      p.y += p.vy;

      // drift back
      p.vx += (p.baseX - p.x) * 0.002;
      p.vy += (p.baseY - p.y) * 0.002;

      if (p.x < -100) p.x = w + 100;
      if (p.x > w + 100) p.x = -100;
      if (p.y < -100) p.y = h + 100;
      if (p.y > h + 100) p.y = -100;

      // draw radial gradient circle
      var radius = p.r * (1 + Math.sin(time * 0.6 + i) * 0.08 + (burstTimer>0?0.6:0));
      var grad = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, 'rgba(255,125,109,0.22)');
      grad.addColorStop(0.4, 'rgba(123,94,247,0.14)');
      grad.addColorStop(1, 'rgba(17,17,17,0)');
      context.fillStyle = grad;
      context.beginPath();
      context.arc(p.x, p.y, radius, 0, Math.PI*2);
      context.fill();
    }

    if (burstTimer > 0) burstTimer -= 1;
    rafId = requestAnimationFrame(draw);
  }

  var rafId = null;

  function start() {
    if (!rafId) draw();
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function burst() {
    burstTimer = 20;
  }

  window.addEventListener('resize', resize);
  init();
  start();

  return { pause: stop, resume: start, burst: burst };
}

// only create t4 if element exists
var el4 = document.getElementById('test-4');
if (el4) {
  window.Sketches.t4 = createHoursOfDarkSketch(el4);
}

// expose backdrop creator
window.createWindowBackdrop = createWindowBackdrop;

// initialize full-page backdrop and welcome overlay
document.addEventListener('DOMContentLoaded', function () {
  window.Sketches = window.Sketches || {};
  var backdropCanvas = document.getElementById('atmo-backdrop');
  if (backdropCanvas && window.createWindowBackdrop) {
    window.Sketches.backdrop = window.createWindowBackdrop(backdropCanvas, { count: 14 });
  }

  // welcome overlay: hide after 2s
  var welcome = document.getElementById('welcome-overlay');
  if (welcome) {
    setTimeout(function () {
      welcome.style.transition = 'opacity 420ms ease, visibility 420ms';
      welcome.style.opacity = '0';
      setTimeout(function () { welcome.style.display = 'none'; }, 520);
    }, 2000);
  }

  // entrance animation for app window after welcome
  var appWin = document.getElementById('app-window');
  if (appWin) {
    appWin.style.opacity = '0';
    appWin.style.transform = 'translateY(18px) scale(0.98)';
    setTimeout(function () {
      appWin.style.transition = 'transform 420ms cubic-bezier(.2,.9,.3,1), opacity 420ms';
      appWin.style.opacity = '1';
      appWin.style.transform = 'translateY(0) scale(1)';
    }, 2200);
  }
});