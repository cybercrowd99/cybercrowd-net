export async function onRequestGet(context){

try{

const url =
new URL(context.request.url);

const token =
url.searchParams.get('token');

const email =
(url.searchParams.get('email') || '')
.trim()
.toLowerCase();

if(!token || !email){

return new Response(
'Missing verification token or email.',
{
status:400,
headers:{
'Content-Type':'text/plain; charset=utf-8'
}
}
);

}

const emailPattern =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(!emailPattern.test(email)){

return new Response(
'Invalid verification email.',
{
status:400,
headers:{
'Content-Type':'text/plain; charset=utf-8'
}
}
);

}

/*
CYBERCROWD TOKEN VALIDATION LAYER
--------------------------------
Current stage:
- token is accepted as a live verification bridge
- email is carried into the success route
- visitor is not allowed through page2.html directly anymore

Production stage still needed:
- store issued tokens
- expire tokens
- compare submitted token to stored token
- mark email verified in database
- prevent token reuse
--------------------------------
*/

console.log(
'CYBERCROWD VERIFY LINK ACCEPTED:',
email
);

console.log(
'CYBERCROWD VERIFY TOKEN:',
token
);

const successUrl =
new URL(
'/verify-success.html',
url.origin
);

successUrl.searchParams.set(
'verified',
'1'
);

successUrl.searchParams.set(
'email',
email
);

successUrl.searchParams.set(
'token',
token
);

return Response.redirect(
successUrl.toString(),
302
);

}catch(error){

console.error(
'CYBERCROWD VERIFY ERROR:',
error
);

return new Response(
'Verification failure.',
{
status:500,
headers:{
'Content-Type':'text/plain; charset=utf-8'
}
}
);

}

}
