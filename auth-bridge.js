const signupForm =
document.getElementById('signupForm');

if(signupForm){

signupForm.addEventListener(
'submit',
async function(e){

e.preventDefault();

const inputs =
signupForm.querySelectorAll('input');

const email =
inputs[0].value.trim();

const password =
inputs[1].value;

const confirmPassword =
inputs[2].value;

const captchaChecked =
inputs[3].checked;

if(!captchaChecked){

alert(
'Continuity verification required.'
);

return;
}

if(password !== confirmPassword){

alert(
'Passwords do not match.'
);

return;
}

try{

const response =
await fetch('/api/auth/signup',{

method:'POST',

headers:{
'Content-Type':'application/json'
},

body:JSON.stringify({

email,
password

})

});

const data =
await response.json();

if(data.success){

localStorage.setItem(
'cc_pending_verify',
email
);

alert(
'Verification email sent. Check your inbox.'
);

window.location.href =
'verify.html';

}else{

alert(
data.message ||
'Continuity enrollment failed.'
);

}

}catch(error){

console.error(error);

alert(
'Connection error. Please try again.'
);

}

});
}
