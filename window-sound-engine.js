const CCAudioContext =
new (
window.AudioContext ||
window.webkitAudioContext
)();

function playTone(freq,duration,type='sine',volume=0.03){

const osc =
CCAudioContext.createOscillator();

const gain =
CCAudioContext.createGain();

osc.type = type;

osc.frequency.value = freq;

gain.gain.value = volume;

osc.connect(gain);

gain.connect(
CCAudioContext.destination
);

osc.start();

setTimeout(function(){

osc.stop();

},duration);

}

function playOpenTone(){

playTone(220,90,'sine',0.03);

setTimeout(function(){

playTone(440,120,'sine',0.03);

},80);

}

function playCloseTone(){

playTone(180,120,'triangle',0.025);

}

function playHoverTone(){

playTone(520,40,'sine',0.015);

}

window.CCSound = {

open:playOpenTone,

close:playCloseTone,

hover:playHoverTone

};
