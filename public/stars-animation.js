(function() {
  'use strict';

  var headers = document.querySelectorAll('.page-header, .page-header-dark');
  if (!headers.length) return;

  headers.forEach(function(header) {
    var canvas = document.createElement('canvas');
    canvas.className = 'page-header-canvas';
    header.insertBefore(canvas, header.firstChild);

    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var w, h;
    var stars = [];
    var shootings = [];
    var frame = 0;

    function resize() {
      var rect = header.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createStar() {
      return {
        x: Math.random() * w,
        y: -2,
        vy: 0.15 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.08,
        radius: 0.5 + Math.random() * 1.2,
        opacity: 0.2 + Math.random() * 0.6,
        twinkleSpeed: 0.01 + Math.random() * 0.03,
        twinklePhase: Math.random() * Math.PI * 2,
        drift: Math.random() * Math.PI * 2
      };
    }

    function createShootingStar() {
      var startX = Math.random() * w * 0.8;
      var angle = 0.3 + Math.random() * 0.4;
      return {
        x: startX,
        y: -5,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3),
        life: 1,
        decay: 0.012 + Math.random() * 0.008,
        length: 30 + Math.random() * 50
      };
    }

    function init() {
      resize();
      stars = [];
      // Pre-fill with scattered stars
      for (var i = 0; i < 60; i++) {
        var s = createStar();
        s.y = Math.random() * h;
        stars.push(s);
      }
    }

    function update() {
      // Add new stars
      if (frame % 3 === 0 && stars.length < 120) {
        stars.push(createStar());
      }

      // Occasional shooting star
      if (Math.random() < 0.004) {
        shootings.push(createShootingStar());
      }

      // Update stars
      for (var i = stars.length - 1; i >= 0; i--) {
        var s = stars[i];
        s.y += s.vy;
        s.x += s.vx + Math.sin(s.drift + frame * 0.005) * 0.05;
        s.twinklePhase += s.twinkleSpeed;

        if (s.y > h + 5) {
          stars.splice(i, 1);
        }
      }

      // Update shooting stars
      for (var j = shootings.length - 1; j >= 0; j--) {
        var ss = shootings[j];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life -= ss.decay;
        if (ss.life <= 0 || ss.x > w + 50 || ss.y > h + 50) {
          shootings.splice(j, 1);
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Draw stars
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = Math.sin(s.twinklePhase) * 0.3 + 0.7;
        var alpha = s.opacity * twinkle;

        // Soft glow
        if (s.radius > 1) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.06) + ')';
          ctx.fill();
        }

        // Star core
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.fill();
      }

      // Draw shooting stars
      for (var j = 0; j < shootings.length; j++) {
        var ss = shootings[j];
        var tailX = ss.x - (ss.vx / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * ss.life;
        var tailY = ss.y - (ss.vy / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * ss.life;

        var grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(255,255,255,' + (ss.life * 0.7) + ')');

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.5 * ss.life, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (ss.life * 0.9) + ')';
        ctx.fill();
      }

      // Subtle top-to-bottom fade overlay
      var vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.9);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      update();
      frame++;
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    init();
    draw();
  });
})();
