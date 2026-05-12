export async function onRequestPost(context){

try{

const body =
await context.request.json();

const email =
(body.email || '')
.trim()
.toLowerCase();

const tier =
(body.tier || 'visitor')
.trim()
.toLowerCase();

const allowedTiers =
[
'visitor',
'member',
'creator'
];

if(!email){

return Response.json({

success:false,
status:'missing_email',
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
status:'invalid_email',
message:'Valid email required.'

},{
status:400
});

}

if(!allowedTiers.includes(tier)){

return Response.json({

success:false,
status:'invalid_tier',
message:'Valid CyberCrowd tier required.'

},{
status:400
});

}

const resendApiKey =
context.env.RESEND_API_KEY || '';

if(!resendApiKey){

return Response.json({

success:false,
status:'missing_resend_api_key',
message:'Enrollment server is missing RESEND_API_KEY.'

},{
status:500
});

}

const enrollmentId =
crypto.randomUUID();

const requestUrl =
new URL(context.request.url);

const origin =
requestUrl.origin;

const tierLabel =
tier === 'visitor'
? 'Visitor Access'
: tier === 'member'
? 'Standard Member'
: 'Content Creator';

const verifyUrl =
origin +
'/api/auth/verify?enrollment=' +
encodeURIComponent(enrollmentId) +
'&tier=' +
encodeURIComponent(tier) +
'&email=' +
encodeURIComponent(email);

const fromEmail =
'CyberCrowd <welcome@cybercrowd.net>';

const serviceContactEmail =
'cybercrowd_services@yahoo.com';

const subject =
'CyberCrowd enrollment access';

const text =
[
'CyberCrowd enrollment access',
'',
'Tier:',
tierLabel,
'',
'Enrollment ID:',
enrollmentId,
'',
'Open this link to continue:',
verifyUrl,
'',
'CyberCrowd Services:',
serviceContactEmail
].join('\n');

const html =
`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>CyberCrowd enrollment access</title>
</head>
<body style="
margin:0;
padding:0;
background:#050505;
color:#ffffff;
font-family:Arial,Helvetica,sans-serif;
">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td style="padding:24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="
max-width:620px;
margin:0 auto;
border:1px solid rgba(0,255,255,0.42);
border-radius:18px;
background:#101414;
">
<tr>
<td style="padding:24px;">
<h1 style="
margin:0 0 14px 0;
font-size:24px;
line-height:1.25;
color:#00ffff;
letter-spacing:1px;
">
CyberCrowd Enrollment
</h1>

<p style="
font-size:16px;
line-height:1.6;
margin:0 0 16px 0;
color:#ffffff;
">
Your CyberCrowd access request was received.
</p>

<p style="
font-size:15px;
line-height:1.6;
margin:0 0 16px 0;
color:#00ffaa;
">
Tier: ${tierLabel}
</p>

<p style="
margin:0 0 22px 0;
">
<a href="${verifyUrl}" style="
display:inline-block;
padding:14px 18px;
background:linear-gradient(90deg,#00ffff,#00ffaa);
color:#001111;
text-decoration:none;
border-radius:10px;
font-weight:bold;
">
Continue CyberCrowd Enrollment
</a>
</p>

<p style="
font-size:13px;
line-height:1.6;
margin:0 0 18px 0;
color:#b8ffff;
">
Copy link:
<br>
<a href="${verifyUrl}" style="
color:#00ffff;
word-break:break-all;
">
${verifyUrl}
</a>
</p>

<p style="
font-size:12px;
line-height:1.6;
margin:0;
color:#9fb9b9;
">
Enrollment ID: ${enrollmentId}
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

const sendResponse =
await fetch(
'https://api.resend.com/emails',
{
method:'POST',

headers:{
'Authorization':'Bearer ' + resendApiKey,
'Content-Type':'application/json',
'User-Agent':'CyberCrowd Enrollment Gateway'
},

body:JSON.stringify({

from:
fromEmail,

to:[
email
],

subject:
subject,

html:
html,

text:
text

})
}
);

const sendText =
await sendResponse.text();

let sendData = {};

if(sendText){

try{

sendData =
JSON.parse(sendText);

}catch(parseError){

sendData = {
raw:sendText
};

}

}

if(!sendResponse.ok){

return Response.json({

success:false,
status:'resend_send_failed',
message:
sendData.message ||
sendData.error ||
'Resend send failed.',

email,
tier,
tierLabel,
enrollmentId,
senderUsed:
fromEmail,

resendStatus:
sendResponse.status,

details:
sendData

},{
status:502
});

}

return Response.json({

success:true,
status:'enrollment_started',
message:'CyberCrowd enrollment started.',
email,
tier,
tierLabel,
enrollmentId,
verifyUrl,
emailDelivery:'accepted_by_resend',
resendEmailId:
sendData.id || '',

senderUsed:
fromEmail

},{
status:200
});

}catch(error){

return Response.json({

success:false,
status:'enrollment_exception',
message:
error.message ||
'Enrollment server exception.'

},{
status:500
});

}

}
