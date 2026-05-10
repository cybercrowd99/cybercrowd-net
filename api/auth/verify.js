export async function onRequestGet(context){

try{

const url =
new URL(context.request.url);

const token =
url.searchParams.get('token');

if(!token){

return Response.json({

success:false,
message:'Missing verification token.'

},{
status:400
});

}

/*
CONTINUITY TOKEN VALIDATION
--------------------------------
Future database verification goes here.

Example:
- lookup verification token
- verify token expiration
- activate continuity identity
- create trusted session
- mark verification complete
--------------------------------
*/

console.log(
'VERIFY TOKEN RECEIVED:',
token
);

return Response.json({

success:true,

message:
'Continuity verification successful.'

},{
status:200
});

}catch(error){

console.error(error);

return Response.json({

success:false,
message:'Verification failure.'

},{
status:500
});

}

}
