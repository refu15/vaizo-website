(function() {
  'use strict';
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var w, h;
  var nodes = [];
  var beams = [];
  var pulses = [];
  var mouse = { x: -9999, y: -9999 };
  var frame = 0;
  var CONFIG = {
    nodeCount: 80,
    connectionDist: 160,
    mouseRadius: 200,
    nodeSpeed: 0.3,
    pulseInterval: 60,
    gridCols: 6,
    gridRows: 4
  };
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function createNode(x, y, type) {
    return {
      x: x || Math.random() * w,
      y: y || Math.random() * h,
      vx: (Math.random() - 0.5) * CONFIG.nodeSpeed,
      vy: (Math.random() - 0.5) * CONFIG.nodeSpeed,
      radius: type === 'anchor' ? 2.5 : 1.5,
      opacity: type === 'anchor' ? 0.7 : 0.3 + Math.random() * 0.3,
      type: type || 'float',
      phase: Math.random() * Math.PI * 2
    };
  }
  function createPulse(fromNode, toNode) {
    return {
      from: fromNode,
      to: toNode,
      t: 0,
      speed: 0.008 + Math.random() * 0.012,
      opacity: 0.8
    };
  }
  function init() {
    resize();
    nodes = [];
    for (var row = 0; row < CONFIG.gridRows; row++) {
      for (var col = 0; col < CONFIG.gridCols; col++) {
        var gx = (w * 0.15) + (col / (CONFIG.gridCols - 1)) * (w * 0.7);
        var gy = (h * 0.1) + (row / (CONFIG.gridRows - 1)) * (h * 0.8);
        gx += (Math.random() - 0.5) * 60;
        gy += (Math.random() - 0.5) * 40;
        nodes.push(createNode(gx, gy, 'anchor'));
      }
    }
    for (var i = 0; i < CONFIG.nodeCount; i++) {
      nodes.push(createNode(null, null, 'float'));
    }
  }
  function updateNodes() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      n.phase += 0.01;
      var dx = n.x - mouse.x;
      var dy = n.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseRadius && dist > 0) {
        var force = (1 - dist / CONFIG.mouseRadius) * 0.8;
        n.vx += (dx / dist) * force;
        n.vy += (dy / dist) * force;
      }
      n.vx *= 0.99;
      n.vy *= 0.99;
      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20;
      if (n.y > h + 20) n.y = -20;
      if (n.type === 'anchor') {
        var speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 0.15) {
          n.vx = (n.vx / speed) * 0.15;
          n.vy = (n.vy / speed) * 0.15;
        }
      }
    }
  }
  function spawnPulses() {
    if (frame % CONFIG.pulseInterval !== 0) return;
    for (var attempt = 0; attempt < 5; attempt++) {
      var a = nodes[Math.floor(Math.random() * nodes.length)];
      var b = nodes[Math.floor(Math.random() * nodes.length)];
      if (a === b) continue;
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < CONFIG.connectionDist) {
        pulses.push(createPulse(a, b));
        break;
      }
    }
  }
  function updatePulses() {
    for (var i = pulses.length - 1; i >= 0; i--) {
      pulses[i].t += pulses[i].speed;
      if (pulses[i].t > 1) {
        if (Math.random() < 0.3) {
          var endNode = pulses[i].to;
          for (var j = 0; j < nodes.length; j++) {
            if (nodes[j] === endNode || nodes[j] === pulses[i].from) continue;
            var dx = nodes[j].x - endNode.x;
            var dy = nodes[j].y - endNode.y;
            if (Math.sqrt(dx * dx + dy * dy) < CONFIG.connectionDist) {
              pulses.push(createPulse(endNode, nodes[j]));
              break;
            }
          }
        }
        pulses.splice(i, 1);
      }
    }
  }
  function drawConnections() {
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x;
        var dy = nodes[i].y - nodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectionDist) {
          var alpha = (1 - dist / CONFIG.connectionDist) * 0.12;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }
  function drawNodes() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var breath = Math.sin(n.phase) * 0.15;
      var r = n.radius * (1 + breath);
      var alpha = n.opacity + breath * 0.2;
      if (n.type === 'anchor') {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.fill();
    }
  }
  function drawPulses() {
    for (var i = 0; i < pulses.length; i++) {
      var p = pulses[i];
      var x = p.from.x + (p.to.x - p.from.x) * p.t;
      var y = p.from.y + (p.to.y - p.from.y) * p.t;
      var alpha = p.opacity * (1 - Math.abs(p.t - 0.5) * 2) * 0.8;
      var trailLen = 0.15;
      var tx = p.from.x + (p.to.x - p.from.x) * Math.max(0, p.t - trailLen);
      var ty = p.from.y + (p.to.y - p.from.y) * Math.max(0, p.t - trailLen);
      var grad = ctx.createLinearGradient(tx, ty, x, y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, 'rgba(255,255,255,' + alpha + ')');
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.6) + ')';
      ctx.fill();
    }
  }
  function drawScanLine() {
    var scanY = (frame * 0.5) % (h + 40) - 20;
    var grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.02)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 20, w, 40);
  }
  function drawAccents() {
    var time = frame * 0.005;
    ctx.save();
    ctx.translate(w * 0.82, h * 0.25);
    ctx.rotate(time * 0.3);
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI / 3) * i;
      var r = 40 + Math.sin(time) * 5;
      var px = Math.cos(angle) * r;
      var py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(w * 0.12, h * 0.75);
    for (var j = 1; j <= 3; j++) {
      ctx.beginPath();
      var cr = j * 25 + Math.sin(time + j) * 5;
      ctx.arc(0, 0, cr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.04 / j) + ')';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(w * 0.7, h * 0.6);
    ctx.rotate(time * 0.2);
    var cs = 15 + Math.sin(time * 1.5) * 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-cs, 0); ctx.lineTo(cs, 0);
    ctx.moveTo(0, -cs); ctx.lineTo(0, cs);
    ctx.stroke();
    ctx.restore();
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    drawAccents();
    drawScanLine();
    drawConnections();
    drawPulses();
    drawNodes();
    updateNodes();
    updatePulses();
    spawnPulses();
    frame++;
    requestAnimationFrame(draw);
  }
  canvas.addEventListener('mousemove', function(e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', function() {
    mouse.x = -9999;
    mouse.y = -9999;
  });
  window.addEventListener('resize', function() {
    resize();
  });
  init();
  draw();
})();