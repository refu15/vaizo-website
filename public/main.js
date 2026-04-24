document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.faq-q').forEach(function(q) {
    q.addEventListener('click', function() {
      this.closest('.faq-item').classList.toggle('open');
    });
  });
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function() {
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        nav.classList.remove('open');
      });
    });
  }
});