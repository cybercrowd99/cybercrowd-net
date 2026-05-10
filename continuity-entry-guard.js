function hasVerifiedContinuitySession(){

const session =
localStorage.getItem(
'cc_verified_session'
);

if(!session){
return false;
}

try{

const parsed =
JSON.parse(session);

return parsed &&
parsed.verified === true;

}catch(error){

console.error(error);

return false;
}

}

function requireVerifiedContinuitySession(){

if(!hasVerifiedContinuitySession()){

window.location.href =
'continu
