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
message:'Access denied.',
status:'missing_email'

},{
status:400
});

}

const emailPattern =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(!emailPattern.test(email)){

return Response.json({

success:false,
message:'Access denied.',
status:'invalid_email'

},{
status:400
});

}

const resendApiKey =
context.env.RESEND_API_KEY || '';

if(!resendApiKey){

return Response.json({

success:false,
message:'Verification email service is not active.',
status:'email_service_inactive',
emailDelivery:'missing_api_key'

},{
status:500
});

}

/*
CYBERCROWD LIVE PUBLIC EMAIL ENVELOPE
------------------------------------
This is the live sender envelope.

Do not use onboarding@resend.dev.
Do not use Yahoo as reply_to.
Do not use mixed sender identity.

Sender:
onboarding@cybercrowd.net

Support/contact in body only:
cybercrowd_services@yahoo.com
------------------------------------
*/

const fromEmail =
'onboarding@cybercrowd.net';

const serviceContactEmail =
'cybercrowd_services@yahoo.com';

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

const emailSubject =
'CyberCrowd access verification';

const emailText =
[
'CyberCrowd access verification',
'',
'Open this link to verify your CyberCrowd access:',
'',
verifyUrl,
'',
'If you did not request this email, ignore it.',
'',
'CyberCrowd Services:',
serviceContactEmail
].join('\n');

const emailHtml =
`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>CyberCrowd access verification</title>
</head>
<body style="
margin:0;
padding:0;
background:#ffffff;
color:#111111;
font-family:Arial,Helvetica,sans-serif;
">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td style="padding:24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="
max-width:620px;
margin:0 auto;
border:1px solid #dddddd;
border-radius:12px;
">
<tr>
<td style="padding:24px;">
<h1 style="
margin:0 0 16px 0;
font-size:24px;
line-height:1.25;
color:#111111;
">
CyberCrowd access verification
</h1>

<p style="
font-size:16px;
line-height:1.6;
margin:0 0 18px 0;
">
Open the link below to verify your CyberCrowd access.
</p>

<p style="
margin:0 0 22px 0;
">
<a href="${verifyUrl}" style="
display:inline-block;
padding:14px 18px;
background:#111111;
color:#ffffff;
text-decoration:none;
border-radius:8px;
font-weight:bold;
">
Verify CyberCrowd Access
</a>
</p>

<p style="
font-size:14px;
line-height:1.6;
margin:0 0 18px 0;
">
Copy link:
<br>
<a href="${verifyUrl}" style="
color:#0057cc;
word-break:break-all;
">
${verifyUrl}
</a>
</p>

<p style="
font-size:13px;
line-height:1.6;
margin:0;
color:#555555;
">
If you did not request this email, ignore it.
<br>
CyberCrowd Services: ${serviceContactEmail}
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
`;

console.log(
'CYBERCROWD LIVE ACCESS REQUEST:',
email
);

console.log(
'CYBERCROWD LIVE EMAIL FROM:',
fromEmail
);

console.log(
'CYBERCROWD VERIFY TOKEN:',
verifyToken
);

console.log(
'CYBERCROWD VERIFY URL:',
verifyUrl
);

const sendResponse =
await fetch(
'https://api.resend.com/emails',
{
method:'POST',

headers:{
'Authorization':'Bearer ' + resendApiKey,
'Content-Type':'application/json'
},

body:JSON.stringify({

from:
fromEmail,

to:
email,

subject:
emailSubject,

html:
emailHtml,

text:
emailText

})
}
);

let sendData = {};
let sendText = '';

try{

sendText =
await sendResponse.text();

if(sendText){

sendData =
JSON.parse(sendText);

}

}catch(error){

sendData = {
raw:sendText
};

}

if(!sendResponse.ok){

console.error(
'CYBERCROWD LIVE EMAIL SEND FAILURE:',
sendData
);

return Response.json({

success:false,

message:
sendData.message ||
sendData.error ||
'Access denied.',

email,

status:
'email_delivery_failed',

verifyToken,

verifyUrl,

emailDelivery:
'failed',

resendStatus:
sendResponse.status,

senderUsed:
fromEmail,

details:
sendData

},{
status:502
});

}

const resendEmailId =
sendData.id || '';

if(!resendEmailId){

console.error(
'CYBERCROWD LIVE EMAIL SEND UNCONFIRMED:',
sendData
);

return Response.json({

success:false,

message:
'Verification email was not confirmed sent.',

email,

status:
'email_delivery_unconfirmed',

verifyToken,

verifyUrl,

emailDelivery:
'unconfirmed',

senderUsed:
fromEmail,

details:
sendData

},{
status:502
});

}

console.log(
'CYBERCROWD LIVE VERIFY EMAIL ACCEPTED:',
email
);

console.log(
'CYBERCROWD RESEND EMAIL ID:',
resendEmailId
);

return Response.json({

success:true,

status:
'pending_verification',

message:
'Verification email sent. Check your inbox.',

email,

verifyToken,

verifyUrl,

emailDelivery:
'sent',

resendEmailId,

senderUsed:
fromEmail,

serviceContactEmail

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
message:'Access denied.',
status:'signup_exception'

},{
status:500
});

}

}
