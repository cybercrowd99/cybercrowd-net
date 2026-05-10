const CCPresence = {

activeWindows:{},

register:function(id){

this.activeWindows[id] = true;

this.update();

},

remove:function(id){

delete this.activeWindows[id];

this.update();

},

count:function(){

return Object.keys(
this.activeWindows
).length;

},

update:function(){

const bar =
document.getElementById(
'cc_presence_bar'
);

if(!bar){
return;
}

bar.innerHTML =
`
LIVE DISTRICTS ACTIVE:
${this.count()}
`;

}

};

window.CCPresence = CCPresence;
