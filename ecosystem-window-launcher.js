function createEcosystemWindow(config){

const existing =
document.getElementById(config.id);

if(existing){

existing.style.display = 'block';

return;
}

const win =
document.createElement('div');

win.id = config.id;

win.style.position = 'fixed';

win.style.top = config.top || '120px';

win.style.left = config.left || '120px';

win.style.width = config.width || '420px';

win.style.minHeight = '240px';

win.style.background =
'rgba(5,10,18,0.96)';

win.style.border =
'1px solid rgba(0,255,255,0.35)';

win.style.borderRadius = '22px';

win.style.backdropFilter = 'blur(10px)';

win.style.boxShadow =
'0 0 26px rgba(0,255,255,0.18)';

win.style.zIndex = '99999';

win.style.overflow = 'hidden';

win.innerHTML = `

<div style="
padding:18px;
background:rgba(0,255,255,0.08);
display:flex;
justify-content:space-between;
align-items:center;
border-bottom:1px solid rgba(0,255,255,0.18);
">

<div style="
color:#00ffff;
font-size:18px;
letter-spacing:2px;
">
${config.title}
</div>

<button
onclick="
document.getElementById('${config.id}').remove()
"
style="
background:none;
border:none;
color:#00ffaa;
font-size:18px;
cursor:pointer;
">
✕
</button>

</div>

<div style="
padding:22px;
color:white;
line-height:1.7;
font-size:14px;
">

${config.content}

</div>

`;

document.body.appendChild(win);

enableWindowDrag(win);

}

function enableWindowDrag(win){

let isDragging = false;

let offsetX = 0;
let offsetY = 0;

const header =
win.firstElementChild;

header.addEventListener(
'mousedown',
function(e){

isDragging = true;

offsetX =
e.clientX - win.offsetLeft;

offsetY =
e.clientY - win.offsetTop;

});

document.addEventListener(
'mousemove',
function(e){

if(!isDragging) return;

win.style.left =
(e.clientX - offsetX) + 'px';

win.style.top =
(e.clientY - offsetY) + 'px';

});

document.addEventListener(
'mouseup',
function(){

isDragging = false;

});

}

window.CCWindow = {

create:createEcosystemWindow

};
