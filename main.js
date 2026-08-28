function createUnDeuxTroisSketch(canvas) {
  var context = canvas.getContext('2d');

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
        context.translate(x + step / 2, y + step / 2);
        context.rotate((Math.random() - 0.5) * 0.4);
        context.translate(-step / 2, -step / 2);

        draw(0, 0, step, step, positions);
        context.restore();
      }
    }
  }

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

    requestAnimationFrame(render);
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
  render();
}

createUnDeuxTroisSketch(document.getElementById('test-1'));

createDisarraySketch(document.getElementById('test-2'), {
  size: 320,
  squareSize: 30,
  randomDisplacement: 15,
  rotateMultiplier: 20,
  offset: 10,
  interactionRadius: 140,
  maxDisplacement: 90,
  lineWidth: 2
});

createDisarraySketch(document.getElementById('test-3'), {
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

    animationFrame = requestAnimationFrame(render);
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
  render();
}

createHoursOfDarkSketch(document.getElementById('test-4'));