function createWindowParticles(win,theme){

const particleLayer =
document.createElement('div');

particleLayer.style.position = 'absolute';

particleLayer.style.inset = '0';

particleLayer.style.pointerEvents = 'none';

particleLayer.style.overflow = 'hidden';

particleLayer.style.zIndex = '0';

for(let i = 0; i < 18; i++){

const p =
document.createElement('div');

const size =
(Math.random() * 4) + 2;

p.style.position = 'absolute';

p.style.width = size + 'px';

p.style.height = size + 'px';

p.style.borderRadius = '50%';

p.style.background =
theme.border;

p.style.opacity =
0.18 + Math.random() * 0.25;

p.style.left =
(Math.random() * 100) + '%';

p.style.top =
(Math.random() * 100) + '%';

p.style.filter =
'blur(1px)';

p.style.transition =
'transform 12s linear';

particleLayer.appendChild(p);

animateParticle(p);

}

win.appendChild(particleLayer);

}

function animateParticle(p){

const x =
(Math.random() * 120) - 60;

const y =
(Math.random() * 120) - 60;

p.animate(

[
{
transform:'translate(0px,0px)'
},
{
transform:
`translate(${x}px,${y}px)`
}
],

{
duration:
8000 + Math.random() * 6000,

iterations:Infinity,

direction:'alternate',

easing:'ease-in-out'
}

);

}

window.CCParticles = {

create:createWindowParticles

};
