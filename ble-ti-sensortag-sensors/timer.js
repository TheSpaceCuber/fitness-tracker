var x;



function start() {
x = setInterval(timer, 10);
} /* Start */

function stop() {
clearInterval(x);
} /* Stop */

var milisec = 0;
var sec = 0; /* holds incrementing value */
var min = 0;
var hour = 0;

/* Contains and outputs returned value of  function checkTime */

var miliSecOut = 0;
var secOut = 0;
var minOut = 0;
var hourOut = 0;

/* Output variable End */


function timer() {
/* Main Timer */


miliSecOut = checkTime(milisec);
secOut = checkTime(sec);
minOut = checkTime(min);
hourOut = checkTime(hour);

milisec = ++milisec;
// sec = ++sec;

if (milisec === 100) {
    milisec = 0;
    sec = ++sec;
}

if (sec == 60) {
    min = ++min;
    sec = 0;
}

if (min == 60) {
    min = 0;
    hour = ++hour;

}

// document.getElementById("milisec").innerHTML = miliSecOut;
document.getElementById("sec").innerHTML = secOut;
document.getElementById("min").innerHTML = minOut;
document.getElementById("hour").innerHTML = hourOut;

}


/* Adds 0 when value is <10 */


function checkTime(i) {
if (i < 10) {
    i = "0" + i;
}
return i;
}

function reset() {


/*Reset*/

milisec = 0;
sec = 0;
min = 0
hour = 0;

// document.getElementById("milisec").innerHTML = "00";
document.getElementById("sec").innerHTML = "00";
document.getElementById("min").innerHTML = "00";
document.getElementById("hour").innerHTML = "00";
stop();

}