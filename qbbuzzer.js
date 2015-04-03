var socket = io();
var name = "";
var playsound = true;
var sound = "pop";
var audio = document.getElementById("sound");
$("#container").hide();
$('.clear').hide();
function buzz(){
socket.emit("buzz",name);
return false;

}
function clearbuzzer(){
socket.emit("clear","");
return false;

}
function checkname(){
	name = prompt('What is your username');
	name = name.trim().replace(/</g,"");
	socket.emit("check name", name);
	return false;

}

function togglesound(){
	playsound = !playsound;
	if(playsound){
		$("#togglesound").text("Sound: On")
		$("#changesound").show();
	}
	else{
		$("#togglesound").text("Sound: Off")
		$("#changesound").hide();
	}
	
}

function playSound(){
	if (playsound){
		audio.play();
	}
}

function changesound(){
	if(sound == "pop"){
		sound = "buzz";
		audio = document.getElementById("sound2");
		$("#changesound").text("Sound: Buzz");
	}
	else if(sound == "buzz"){
		sound = "pop";
		audio = document.getElementById("sound");
		$("#changesound").text("Sound: Pop");
	}
}


socket.on('locked', function(msg){
$('#buzzbutton').addClass('locked').removeClass('default').text('Locked').prop("disabled",true);
$('#container').show(250).text(msg+ " has buzzed");
$('.clear').hide();
playSound();
});

socket.on('your buzz', function(msg){
$('#buzzbutton').addClass('buzzed').removeClass('default').text('Your Buzz').prop("disabled",true);
$('.clear').show();
playSound();

});

socket.on('clear', function(msg){
$('#buzzbutton').addClass('default').removeClass('buzzed').removeClass('locked').text('Buzz').prop("disabled",false);
$('#container').hide(250).text("");
$('.clear').hide();
});

socket.on('good name', function(msg){
$("#users").append("<p> Your username is: "+msg+"</p>");
});
socket.on('bad name', function(msg){
alert("Username already taken");
checkname();
});
checkname();