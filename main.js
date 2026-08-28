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
