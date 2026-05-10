function createVerifiedContinuitySession(){

const continuitySession = {

verified:true,

created:Date.now(),

device:navigator.userAgent,

timezone:
Intl.DateTimeFormat()
.resolvedOptions()
.timeZone

};

localStorage.setItem(
'cc_verified_session',
JSON.stringify(
continuitySession
)
);

}

function getVerifiedContinuitySession(){

const session =
localStorage.getItem(
'cc_verified_session'
);

if(!session){
return null;
}

try{

return JSON.parse(session);

}catch(error){

console.error(error);

return null;
}

}

function clearVerifiedContinuitySession(){

localStorage.removeItem(
'cc_verified_session'
);

}

window.CCSession = {

create:
createVerifiedContinuitySession,

get:
getVerifiedContinuitySession,

clear:
clearVerifiedContinuitySession

};
