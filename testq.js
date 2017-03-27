var Q = require('q');

function Step1(){
    console.log("1");
}

function Step2(){
    console.log("2");
}

function Step3(){
    console.log("3");
}

Q.fcall(Step1).then(Step2).then(Step3);