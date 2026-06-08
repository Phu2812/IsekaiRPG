
// ============ STARS ============
(function() {
  const s = document.getElementById('stars');
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'star';
    const size = Math.random() * 2 + 1;
    el.style.cssText = `
      width:${size}px;height:${size}px;
      left:${Math.random()*100}%;top:${Math.random()*100}%;
      --d:${(Math.random()*3+1).toFixed(1)}s;
      animation-delay:${(Math.random()*3).toFixed(1)}s;
    `;
    s.appendChild(el);
  }
})();