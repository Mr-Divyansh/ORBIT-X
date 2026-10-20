(function(){
  "use strict";
  document.documentElement.classList.add("js");
  var header=document.querySelector(".site-header");
  var toggle=document.querySelector(".nav-toggle");
  var menu=document.querySelector(".nav-links");
  var reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function onScroll(){if(header)header.classList.toggle("scrolled",window.scrollY>8);}
  window.addEventListener("scroll",onScroll,{passive:true});onScroll();
  if(toggle&&menu){
    toggle.addEventListener("click",function(){var open=menu.classList.toggle("open");toggle.setAttribute("aria-expanded",open?"true":"false");});
    menu.addEventListener("click",function(e){if(!e.target.closest("a"))return;menu.classList.remove("open");toggle.setAttribute("aria-expanded","false");});
  }
  document.addEventListener("click",function(e){var link=e.target.closest('a[href^="#"]');if(!link)return;var id=link.getAttribute("href");if(!id||id==="#")return;var target=document.querySelector(id);if(!target)return;e.preventDefault();var offset=(header?header.offsetHeight:0)+14;var top=target.getBoundingClientRect().top+window.scrollY-offset;window.scrollTo({top:Math.max(top,0),behavior:reduceMotion?"auto":"smooth"});if(history.pushState)history.pushState(null,"",id);});
  var reveals=document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window&&reveals.length){
    var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add("visible");io.unobserve(entry.target);}});},{threshold:0.1,rootMargin:"0px 0px -40px 0px"});
    reveals.forEach(function(el){io.observe(el);});
  }else{reveals.forEach(function(el){el.classList.add("visible");});}
  var spyTargets=document.querySelectorAll("section[id]");
  var menuAnchors=document.querySelectorAll('.nav-links a[href^="#"]');
  if("IntersectionObserver" in window&&spyTargets.length&&menuAnchors.length){
    var spy=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;var id="#"+entry.target.id;menuAnchors.forEach(function(a){a.classList.toggle("active",a.getAttribute("href")===id);});});},{rootMargin:"-45% 0px -50% 0px"});
    spyTargets.forEach(function(s){spy.observe(s);});
  }
  var year=document.getElementById("year");
  if(year)year.textContent=String(new Date().getFullYear());
  var canvas=document.getElementById("stars");
  if(canvas&&canvas.getContext){
    var ctx=canvas.getContext("2d");
    var stars=[];
    var w=0,h=0;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    function resize(){var host=canvas.parentElement;if(!host)return;var rect=host.getBoundingClientRect();w=rect.width;h=rect.height;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(dpr,0,0,dpr,0,0);var count=Math.min(110,Math.max(40,Math.round((w*h)/15000)));stars=[];for(var i=0;i<count;i++){stars.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.3+0.3,s:Math.random()*0.22+0.05,a:Math.random()*0.5+0.25});}}
    function paint(animate){ctx.clearRect(0,0,w,h);for(var i=0;i<stars.length;i++){var st=stars[i];if(animate){st.y-=st.s;if(st.y<-2){st.y=h+2;st.x=Math.random()*w;}}ctx.globalAlpha=st.a;ctx.fillStyle=i%9===0?"#00e65c":"#eef4ed";ctx.beginPath();ctx.arc(st.x,st.y,st.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;if(animate)requestAnimationFrame(function(){paint(true);});}
    resize();window.addEventListener("resize",resize);paint(!reduceMotion);
  }
  var sparkle=document.getElementById("sparkle");
  if(sparkle&&sparkle.getContext){
    var sctx=sparkle.getContext("2d");
    var sw=0,sh=0,particles=[];
    var mouse={x:-1000,y:-1000};
    function sresize(){var host=sparkle.parentElement;if(!host)return;var rect=host.getBoundingClientRect();sw=rect.width;sh=rect.height;sparkle.width=Math.round(sw*dpr);sparkle.height=Math.round(sh*dpr);sparkle.style.width=sw+"px";sparkle.style.height=sh+"px";sctx.setTransform(dpr,0,0,dpr,0,0);particles=[];}
    function addSpark(x,y){particles.push({x:x,y:y,vx:(Math.random()-0.5)*1.5,vy:(Math.random()-0.5)*1.5,life:1,decay:Math.random()*0.02+0.015,size:Math.random()*2+1});}
    window.addEventListener("mousemove",function(e){var rect=sparkle.getBoundingClientRect();mouse.x=e.clientX-rect.left;mouse.y=e.clientY-rect.top;for(var i=0;i<3;i++){addSpark(mouse.x,mouse.y);}});
    window.addEventListener("resize",sresize);sresize();
    function sdraw(){sctx.clearRect(0,0,sw,sh);for(var i=0;i<particles.length;i++){var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.life-=p.decay;p.vx*=0.92;p.vy*=0.92;if(p.life<=0){particles.splice(i,1);i--;continue;}sctx.globalAlpha=Math.max(0,p.life);sctx.fillStyle="#00e65c";sctx.beginPath();sctx.arc(p.x,p.y,p.size,0,Math.PI*2);sctx.fill();}sctx.globalAlpha=1;requestAnimationFrame(sdraw);}
    sdraw();
  }
})();
