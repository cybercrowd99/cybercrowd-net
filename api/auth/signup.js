export async function onRequestPost(context){

try{

const body =
await context.request.json();

const email =
(body.email || '')
.trim()
.toLowerCase();

if(!email){

return Response.json({

success:false,
message:'Email required.'

},{
status:400
});

}

const emailPattern =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(!emailPattern.test(email)){

return Response.json({

success:false,
message:'Invalid email format.'

},{
status:400
});

}

const verifyToken =
crypto.randomUUID();

const requestUrl =
new URL(context.request.url);

const origin =
requestUrl.origin;

const verifyUrl =
origin +
'/api/auth/verify?token=' +
encodeURIComponent(verifyToken) +
'&email=' +
encodeURIComponent(email);

console.log(
'CYBERCROWD FREE ENTRY REQUEST:',
email
);

console.log(
'CYBERCROWD VERIFY TOKEN:',
verifyToken
);

console.log(
'CYBERCROWD VERIFY URL:',
verifyUrl
);

/*
EMAIL DELIVERY LAYER
--------------------------------
This endpoint now creates the verification token and verification URL.

The next required production connection is an email sender:
- Resend
- SendGrid
- MailChannels
- AWS SES
- Cloudflare Email Worker route

Until email sending is connected, this endpoint returns the verifyUrl
so the flow can be tested without granting access locally.
--------------------------------
*/

return Response.json({

success:true,

status:'pending_verification',

message:
'Verification created. Email delivery layer must send the verification URL.',

email,

verifyToken,

verifyUrl

},{
status:200
});

}catch(error){

console.error(
'CYBERCROWD SIGNUP ERROR:',
error
);

return Response.json({

success:false,
message:'Continuity enrollment failure.'

},{
status:500
});

}

}
