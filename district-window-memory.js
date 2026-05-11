const CCDistrictMemory = {

save:function(id,element){

const state = {

left:element.style.left,

top:element.style.top,

width:element.style.width

};

localStorage.setItem(

'cc_window_' + id,

JSON.stringify(state)

);

},

load:function(id){

const raw =
localStorage.getItem(
'cc_window_' + id
);

if(!raw){
return null;
}

try {

return JSON.parse(raw);

} catch(err){

return null;

}

},

remove:function(id){

localStorage.removeItem(
'cc_window_' + id
);

}

};

window.CCDistrictMemory =
CCDistrictMemory;
