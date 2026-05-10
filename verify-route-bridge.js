async function verifyContinuityToken(){

try{

const params =
new URLSearchParams(
window.location.search
);

const token =
params.get('token');

if(!token){

console.warn(
'Missing continuity token.'
);

return;
}

const response =
await fetch(
`/api/auth/verify?token=${token}`
);

const data =
await response.json();

if(data.success){

localStorage.setItem(
'cc_verified',
'true'
);

window.location.href =
'verify-success.html';

}else{

alert(
data.message ||
'Verification failed.'
);

}

}catch(error){

console.error(error);

alert(
'Continuity verification connection failure.'
);

}

}

verifyContinuityToken();
