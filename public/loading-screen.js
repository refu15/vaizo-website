(function() {
  'use strict';

  var screen = document.getElementById('loading-screen');
  var canvas = document.getElementById('loading-canvas');
  if (!screen || !canvas) return;

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var w = window.innerWidth;
  var h = window.innerHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Shooting star parameters
  var star = {
    x: w * 0.15,
    y: h * 0.08,
    angle: Math.atan2(h * 0.55, w * 0.65),
    speed: 0,
    accel: 0.35,
    maxSpeed: 18,
    tailLength: 0,
    maxTail: 180,
    phase: 0,       // 0=wait, 1=shoot, 2=burst, 3=fade
    timer: 0,
    burstParticles: [],
    opacity: 1
  };

  var frame = 0;
  var startDelay = 12; // frames before star begins

  function createBurstParticle(x, y) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 1 + Math.random() * 4;
    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.015 + Math.random() * 0.02,
      radius: 0.5 + Math.random() * 1.5
    };
  }

  function update() {
    frame++;

    if (star.phase === 0) {
      // Wait phase
      star.timer++;
      if (star.timer > startDelay) {
        star.phase = 1;
        star.timer = 0;
      }
    }

    else if (star.phase === 1) {
      // Shooting phase
      star.speed = Math.min(star.speed + star.accel, star.maxSpeed);
      star.x += Math.cos(star.angle) * star.speed;
      star.y += Math.sin(star.angle) * star.speed;
      star.tailLength = Math.min(star.tailLength + 6, star.maxTail);

      // End when past center-ish
      if (star.x > w * 0.6 && star.y > h * 0.45) {
        star.phase = 2;
        star.timer = 0;
        // Create burst
        for (var i = 0; i < 30; i++) {
          star.burstParticles.push(createBurstParticle(star.x, star.y));
        }
      }
    }

    else if (star.phase === 2) {
      // Burst phase
      star.timer++;
      star.tailLength = Math.max(star.tailLength - 8, 0);

      for (var j = star.burstParticles.length - 1; j >= 0; j--) {
        var p = star.burstParticles[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= p.decay;
        if (p.life <= 0) star.burstParticles.splice(j, 1);
      }

      if (star.burstParticles.length === 0 && star.tailLength === 0) {
        star.phase = 3;
        star.timer = 0;
      }
    }

    else if (star.phase === 3) {
      // Fade out
      star.timer++;
      if (star.timer > 15) {
        screen.classList.add('fade-out');
        setTimeout(function() {
          screen.style.display = 'none';
        }, 800);
        return false;
      }
    }

    return true;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    if (star.phase === 1 || (star.phase === 2 && star.tailLength > 0)) {
      // Tail
      var tailX = star.x - Math.cos(star.angle) * star.tailLength;
      var tailY = star.y - Math.sin(star.angle) * star.tailLength;

      var grad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.7, 'rgba(255,255,255,0.4)');
      grad.addColorStop(1, 'rgba(255,255,255,0.95)');

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(star.x, star.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Wider soft trail
      var grad2 = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
      grad2.addColorStop(0, 'rgba(255,255,255,0)');
      grad2.addColorStop(1, 'rgba(255,255,255,0.08)');
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(star.x, star.y);
      ctx.strokeStyle = grad2;
      ctx.lineWidth = 8;
      ctx.stroke();
    }

    if (star.phase === 1) {
      // Star head glow
      var glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 20);
      glow.addColorStop(0, 'rgba(255,255,255,0.9)');
      glow.addColorStop(0.3, 'rgba(255,255,255,0.3)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(star.x - 20, star.y - 20, 40, 40);

      // Core
      ctx.beginPath();
      ctx.arc(star.x, star.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    // Burst particles
    for (var i = 0; i < star.burstParticles.length; i++) {
      var p = star.burstParticles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (p.life * 0.8) + ')';
      ctx.fill();
    }
  }

  function loop() {
    var running = update();
    draw();
    if (running) requestAnimationFrame(loop);
  }

  loop();
})();
