function buildWindowActions(config){

const openPath =
config.openPath || null;

const waitlistPath =
config.waitlistPath || 'continuity-enrollment-gate.html';

let openButton = '';

if(openPath){

openButton =
`
<button
onclick="window.location.href='${openPath}'"
style="
width:100%;
padding:13px;
margin-top:16px;
border:none;
border-radius:14px;
background:linear-gradient(90deg,#00ffff,#00ffaa);
color:black;
font-weight:bold;
cursor:pointer;
">
OPEN DISTRICT
</button>
`;

}

const waitlistButton =
`
<button
onclick="window.location.href='${waitlistPath}'"
style="
width:100%;
padding:13px;
margin-top:12px;
border:1px solid rgba(0,255,255,0.35);
border-radius:14px;
background:rgba(0,255,255,0.05);
color:#00ffff;
font-weight:bold;
cursor:pointer;
">
JOIN / VERIFY ACCESS
</button>
`;

const closeNote =
`
<div style="
margin-top:14px;
opacity:.55;
font-size:12px;
line-height:1.6;
text-align:center;
">
Close the window to return to NAV.
</div>
`;

return openButton + waitlistButton + closeNote;

}

window.CCWindowActions = {

build:buildWindowActions

};
