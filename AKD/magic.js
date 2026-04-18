// magic.js - Modern classy enhancements for Letter to Osagyefo
// Features: animated particles, parallax hero, custom cursor, FAB, scroll progress, confetti

(function(){
  // --- 1. Animated Particles ---
  function createParticles() {
    const canvas = document.createElement('canvas');
    canvas.className = 'magic-particles';
    Object.assign(canvas.style, {
      position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: 0, opacity: 0.18
    });
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w = window.innerWidth, h = window.innerHeight;
    function resize() { w = window.innerWidth; h = window.innerHeight; canvas.width = w; canvas.height = h; }
    window.addEventListener('resize', resize); resize();
    const colors = ['#E8B923', '#D43F3A', '#2D5F3F'];
    const particles = Array.from({length: 38}, () => ({
      x: Math.random()*w, y: Math.random()*h, r: 1.5+Math.random()*2.5,
      dx: -0.2+Math.random()*0.4, dy: 0.1+Math.random()*0.3,
      color: colors[Math.floor(Math.random()*colors.length)],
      alpha: 0.5+Math.random()*0.5
    }));
    function draw() {
      ctx.clearRect(0,0,w,h);
      for(const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,2*Math.PI);
        ctx.fillStyle = p.color; ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if(p.x<0) p.x=w; if(p.x>w) p.x=0; if(p.y>h) p.y=0;
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  // --- 2. Parallax Hero ---
  function parallaxHero() {
    const hero = document.querySelector('.page-header, .hero');
    if(!hero) return;
    hero.style.perspective = '900px';
    hero.addEventListener('mousemove', e => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX-rect.left)/rect.width-0.5;
      const y = (e.clientY-rect.top)/rect.height-0.5;
      hero.style.transform = `rotateY(${x*8}deg) rotateX(${-y*8}deg)`;
    });
    hero.addEventListener('mouseleave', ()=>{
      hero.style.transform = '';
    });
  }

  // --- 3. Custom Cursor --- (disabled)
  function customCursor() {}

  // --- 4. Floating Action Button (FAB) ---
  function floatingActionButton() {
    const fab = document.createElement('button');
    fab.className = 'magic-fab';
    fab.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#E8B923" stroke-width="2"/><path d="M14 8v8m0 0v4m0-4h4m-4 0H10" stroke="#D43F3A" stroke-width="2" stroke-linecap="round"/></svg>';
    Object.assign(fab.style, {
      position:'fixed', right:'2.2rem', bottom:'2.2rem', zIndex:1200,
      width:'56px', height:'56px', borderRadius:'50%', border:'none',
      background:'linear-gradient(135deg,#fff 60%,#E8B923 100%)',
      boxShadow:'0 8px 32px #E8B92344, 0 2px 8px #D43F3A22',
      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
      transition:'box-shadow 0.2s, transform 0.2s',
      outline:'none',
    });
    fab.addEventListener('mouseenter',()=>{fab.style.transform='scale(1.08)';});
    fab.addEventListener('mouseleave',()=>{fab.style.transform='';});
    fab.title = 'Write a Letter';
    fab.onclick = ()=>{ window.location.href = 'write.html'; };
    document.body.appendChild(fab);
  }

  // --- 5. Scroll Progress Bar ---
  function scrollProgressBar() {
    const bar = document.createElement('div');
    bar.className = 'magic-scroll-bar';
    Object.assign(bar.style, {
      position:'fixed', top:0, left:0, height:'4px', width:'0%', zIndex:2000,
      background:'linear-gradient(90deg,#D43F3A,#E8B923,#2D5F3F)',
      boxShadow:'0 2px 8px #E8B92333', transition:'width 0.2s',
    });
    document.body.appendChild(bar);
    window.addEventListener('scroll',()=>{
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const sc = Math.max(0,window.scrollY);
      bar.style.width = (h?Math.min(100,sc/h*100):0)+'%';
    });
  }

  // --- 6. Confetti Celebration ---
  function confettiBurst() {
    const c = document.createElement('canvas');
    c.className = 'magic-confetti';
    Object.assign(c.style, {position:'fixed',left:0,top:0,width:'100vw',height:'100vh',pointerEvents:'none',zIndex:3000});
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    let w=window.innerWidth,h=window.innerHeight; c.width=w; c.height=h;
    window.addEventListener('resize',()=>{w=window.innerWidth;h=window.innerHeight;c.width=w;c.height=h;});
    const colors = ['#E8B923','#D43F3A','#2D5F3F','#fff'];
    const confetti = Array.from({length:64},()=>({
      x:Math.random()*w, y:-20-Math.random()*40, r:6+Math.random()*8, d:Math.random()*360,
      dx:-1+Math.random()*2, dy:2+Math.random()*2, color:colors[Math.floor(Math.random()*colors.length)]
    }));
    let frame=0;
    function draw() {
      ctx.clearRect(0,0,w,h);
      for(const p of confetti) {
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.d*Math.PI/180);
        ctx.fillStyle=p.color;
        ctx.globalAlpha=0.85;
        ctx.beginPath();
        ctx.arc(0,0,p.r,0,2*Math.PI);
        ctx.fill();
        ctx.restore();
        p.x+=p.dx; p.y+=p.dy; p.d+=2;
      }
      frame++;
      if(frame<90) requestAnimationFrame(draw);
      else c.remove();
    }
    draw();
  }
  // Listen for quiz/letter submit events
  window.addEventListener('magic:celebrate', confettiBurst);

  // --- 7. Inject CSS ---
  const css = `
    .magic-cursor { pointer-events:none; mix-blend-mode:exclusion; }
    .magic-fab { box-shadow: 0 8px 32px #E8B92344, 0 2px 8px #D43F3A22; }
    .magic-fab svg { display:block; }
    .magic-scroll-bar { border-radius:2px; }
    .magic-particles { pointer-events:none; }
    @media (max-width: 600px) {
      .magic-fab { right:1rem; bottom:1rem; width:44px; height:44px; }
    }
  `;
  const style = document.createElement('style'); style.innerHTML = css; document.head.appendChild(style);

  // --- 8. Init all features ---
  createParticles();
  parallaxHero();
  customCursor();
  floatingActionButton();
  scrollProgressBar();

  // --- 9. Expose confetti trigger ---
  window.magicCelebrate = function(){ window.dispatchEvent(new Event('magic:celebrate')); };
})();
