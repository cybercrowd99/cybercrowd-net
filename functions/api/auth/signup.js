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
message:'Email required.',
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
message:'Invalid email format.',
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
message:'RESEND_API_KEY is missing. Verification email was not sent.',
status:'email_not_sent',
emailDelivery:'missing_api_key'

},{
status:500
});

}

/*
CYBERCROWD SENDER FORCE
-----------------------
This forces the same Resend starter sender path that already reached the inbox.

Do not use CC_EMAIL_FROM in this version.
Do not use onboarding@cybercrowd.net in this version.

Reply/contact remains CyberCrowd services.
-----------------------
*/

const fromEmail =
'onboarding@resend.dev';

const serviceReplyEmail =
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
'Verify your CyberCrowd free entry';

const emailText =
[
'CyberCrowd Free Entry Verification',
'',
'You requested free CyberCrowd access.',
'',
'Click this verification link to continue:',
verifyUrl,
'',
'If you did not request this, ignore this email.',
'',
'CyberCrowd Services:',
serviceReplyEmail
].join('\n');

const emailHtml =
`
<div style="
font-family:Arial,sans-serif;
background:#050505;
color:white;
padding:28px;
">
<div style="
max-width:620px;
margin:0 auto;
border:1px solid rgba(0,255,255,.35);
border-radius:22px;
padding:26px;
background:rgba(5,10,18,.96);
">
<h1 style="
color:#00ffff;
letter-spacing:2px;
">
CyberCrowd Free Entry
</h1>

<p style="
line-height:1.7;
opacity:.88;
">
You requested free CyberCrowd access.
Click the verification button below to continue.
</p>

<p>
<a href="${verifyUrl}" style="
display:inline-block;
padding:16px 22px;
border-radius:16px;
background:linear-gradient(90deg,#00ffff,#00ffaa);
color:black;
font-weight:bold;
text-decoration:none;
letter-spacing:1px;
">
VERIFY CYBERCROWD ENTRY
</a>
</p>

<p style="
line-height:1.7;
opacity:.72;
font-size:13px;
">
If the button does not work, copy and paste this link:
<br>
<span style="
color:#00ffaa;
word-break:break-all;
">
${verifyUrl}
</span>
</p>

<p style="
margin-top:24px;
font-size:12px;
opacity:.62;
">
CyberCrowd Services: ${serviceReplyEmail}
</p>
</div>
</div>
`;

console.log(
'CYBERCROWD FREE ENTRY REQUEST:',
email
);

console.log(
'CYBERCROWD FORCE SENDER:',
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

to:[
email
],

reply_to:
serviceReplyEmail,

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
'CYBERCROWD EMAIL SEND FAILURE:',
sendData
);

return Response.json({

success:false,

message:
sendData.message ||
sendData.error ||
'Resend rejected the verification email.',

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

replyTo:
serviceReplyEmail,

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
'CYBERCROWD EMAIL SEND WARNING: RESEND ACCEPTED WITHOUT ID',
sendData
);

return Response.json({

success:false,

message:
'Resend response did not include an email id. Verification email was not confirmed sent.',

email,

status:
'email_delivery_unconfirmed',

verifyToken,

verifyUrl,

emailDelivery:
'unconfirmed',

senderUsed:
fromEmail,

replyTo:
serviceReplyEmail,

details:
sendData

},{
status:502
});

}

console.log(
'CYBERCROWD VERIFY EMAIL SENT:',
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

serviceReplyEmail

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
message:'Continuity enrollment failure.',
status:'signup_exception'

},{
status:500
});

}

}
