let socket = io.connect(
	window.location.origin,
	{
		reconnection: true,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 2000,
		reconnectionAttempts: Infinity,
		closeOnBeforeunload: false,
		upgrade: false,
		transports: ["websocket"]
	}
);

const _msg = sokkai.lang.getMessage;

let noSleep = new NoSleep("Sokkai");
let name = "";
let room = "";
let title = "";
let playsound = true;
let dispinfo = true;
let disphist = true;
let dispsettings = false;
let sound = "pop";
let audio = "sound";
let buzzed = false;
let emptyname = false;
let finished = false;
let canSpace = true;
let lastping = Date.now();
let canReload = false;
let lastbuzz = 0;
let timeoutID;
let clearTimer;
let newLink = document.createElement('link');
let redIcon = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAJOgAACToAYJjBRwAAAAMSURBVBhXY7jIxQUAApUA5qdS4JwAAAAASUVORK5CYII="
let greenIcon = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAJOgAACToAYJjBRwAAAAMSURBVBhXY+BfLAMAAZMAz1929fMAAAAASUVORK5CYII="


let usernameInput;
let roomNameInput;
let roomListBtn;
let roomnameForm;
let usernameForm;
let mainContainer
let buzzBtn;
let infoBtn;
let info;
let historyHolder;
let historyWrapper;
let toggleHistory;
let roomListEl;
let roomListHeader;
let clear;
let popup;
let usersHolder;
let changeSound;
let toggleSound;
let reconnectBtn;
let clearHistoryBtn;
let roomNameDisp;
let userNameDisp;
let settingsContainer;
let settingsBtn;
let header;
let footer;
let languageSelector;

function init() {

	usernameInput = $("#usernameinput")
	roomNameInput = $("#roomnameinput");
	roomListBtn = $("#roomlistbutton");
	roomnameForm = $("#roomname");
	usernameForm = $("#username");
	mainContainer = $("#container");
	buzzBtn = $("#buzzbutton");
	infoBtn = $("#infobutton");
	info = $("#info");
	historyHolder = $("#history");
	historyWrapper = $("#historywrapper");
	toggleHistory = $("#togglehist");
	roomListEl = $("#roomlist");
	roomListHeader = $("#roomsListHeader");
	clear = $('.clear');
	popup = $("#popup");
	usersHolder = $("#users");
	changeSound = $("#changesound");
	toggleSound = $("#togglesound");
	reconnectBtn = $("#reconnect");
	clearHistoryBtn = $("#clearhist");

	roomNameDisp = $('#roomNameDisp');
	userNameDisp = $('#userNameDisp');

	settingsContainer = $('#settingsContainer');
	settingsBtn = $('#togglesettings');
	header = $('header');
	footer = $('footer');
	languageSelector = $('#langSelector');
}

function entername() {
	if (usernameInput.val().trim().length > 0) {
		name = usernameInput.val();
	}
	else{
		emptyname = true;
		name = genRandomName();
	}
	checkname(name);
}

function checkname(str) {
	if (typeof str == "undefined") {
		socket.emit("check name", "");
	}
	else{
		socket.emit("check name", str);
	}
	return false;
}
function enterroom() {
	if (roomNameInput.val().length > 0) {
		room = roomNameInput.val();
	}
	else {
		room = "default";
	}
	//console.log(`Joining room: ${room}`);
	getroom(room);
}
function getroom(str) {
	if (typeof str == "undefined") {
		socket.emit("send room", "");
	}
	else{
		socket.emit("send room", str);
		//console.log(`Emitted: send room - ${str}`);
	}
	return false;
}
function getroomlist() {
	roomListBtn.text(_msg("REFRESH_LIST", "Refresh List"));
	socket.emit("get roomlist");
}

function reload() {
	lastping = Date.now();
	localStorage.setItem("name",name);
	localStorage.setItem("room",room);
	localStorage.setItem("refreshed","true");
	noSleep.disable();
	setTimeout(function() { location.reload(false) },500);
}

function enableNoSleepAndJoin() {
	//console.log("Enabling NoSleep...");
	noSleep.enable();
	enterroom();
}

$(document).ready(function() {

	init();

	roomnameForm.hide();
	usernameForm.hide();
	mainContainer.hide();
	usernameInput.hide();
	settingsContainer.hide();
	clear.hide();

	roomNameInput.keypress(
		function(e) {
			if (e.which === 13) {
				enterroom();
				return false;
			}
		});
	usernameInput.keypress(
		function(e) {
			if (e.which === 13) {
				entername();
				return false;
			}
		}
	);

	languageSelector.change(selectLanguage)

	circle();

	if (localStorage.getItem("refreshed") == "true") {
		popup.hide();
		name = localStorage.getItem("name");
		room = localStorage.getItem("room");
		getroom(room);
		usernameForm.hide();
		setTimeout(function() {
			checkname(name);
			localStorage.setItem("refreshed","");
		},500);
		
	}
	else{
		roomnameForm.show();
		usernameInput.val("");
		roomNameInput.val("");
	}

	roomListEl.change(function() {
		getroom($(this).val());
	});

});

function newEle(ele, text) {
	ele = document.createElement(ele);
	$(ele).text(text);
	return ele;
}

function changeIcon(imgSrc) {
    newLink.href='data:image/png;base64,' + imgSrc;
}

$(document).keydown(function(e) {
	if (e.which === 32) {
		if (finished) {
			e.preventDefault();
			if (canSpace) {
				if (!buzzed) {
					buzz();
				}
				else if (Date.now() - lastbuzz >= 500) {
					clearbuzzer();
				}
				canSpace = false;
			}
		}
	}
});


$(document).keyup(function(e) {
	if (e.which === 32 && finished && !canSpace) {
		canSpace = true;
	}
});

$(window).resize(circle);

function circle() {
	/*
	if (window.matchMedia("(max-width: 525px)").matches) {
		let width = buzzBtn.width();
		buzzBtn.css("height", width);
		buzzBtn.css("border-radius", width/2);
	}
	else{
		buzzBtn.css("border-radius", "5px");
		buzzBtn.css("height", "");

	} */

	if (buzzBtn) {
		let height = buzzBtn.height();
		buzzBtn.css("width", height);
		buzzBtn.css("border-radius", height/2);
	}
}

function buzz() {
	if (!buzzed) {
		socket.emit("buzz", name);
	}
	return false;
}

function clearbuzzer() {
	if (Date.now() - lastbuzz >= 250) {
		clearTimeout(timeoutID);
		clearInterval(clearTimer);
		socket.emit("clear", "");
		buzzed = false;
		return false;
	}
}

function togglesound() {
	playsound = !playsound;

	if (playsound) {
		toggleSound.text(_msg("TOGGLE_SOUND_ON", "Sound: On"));
		changeSound.show();
	}
	else{
		toggleSound.text(_msg("TOGGLE_SOUND_OFF", "Sound: Off"));
		changeSound.hide();
	}
}

function playSound() {
	if (playsound) {
		document.getElementById(audio).play();
	}
}

function changesound() {
	if (sound === "pop") {
		sound = "buzz";
		audio = "sound2";
		changeSound.text(_msg("TOGGLE_SOUND_BUZZ", "Sound: Buzz"));
	}
	else if (sound === "buzz") {
		sound = "pop";
		audio = "sound";
		changeSound.text(_msg("TOGGLE_SOUND_POP", "Sound: Pop"));
	}
}

function toggleinfo() {
	if (dispinfo) {
		dispinfo = false;
		footer.hide();
		infoBtn.text(_msg("TOGGLE_INFO_SHOW", "Show Info"));
	}
	else{
		dispinfo = true;
		footer.show();
		infoBtn.text(_msg("TOGGLE_INFO_HIDE", "Hide Info"));
	}
	circle();
}

function togglesettings() {
	if (dispsettings) {
		dispsettings = false;
		popup.hide();
		settingsContainer.hide();
		settingsBtn.attr('data-icon','☰');
		header.css('z-index', 0);
	}
	else{
		dispsettings = true;
		popup.show();
		settingsContainer.show();
		settingsBtn.attr('data-icon', '×');
		header.css('z-index', 3);
	}
}

function togglehistory() {
	if (disphist) {
		disphist = false;
		historyWrapper.addClass('hidden').hide();
		clearHistoryBtn.hide();
		toggleHistory.text(_msg("TOGGLE_HISTORY_SHOW", "Show History"));
	}
	else{
		disphist = true;
		historyWrapper.removeClass('hidden').show();
		clearHistoryBtn.show();
		toggleHistory.text(_msg("TOGGLE_HISTORY_HIDE", "Hide History"));
	}
}

function selectLanguage() {
	let lang = languageSelector.val();
	sokkai.lang.changeLanguage(lang);
}

function decodeDate(d) {
	return (new Date(d) + "").substring(16, 24);
}

function genRandomName() {
	const ADJ = ["Funny", "Hairy", "Lazy", "Cool", "Amazing", "Bored", "Big", "Little", "Crazy", "Happy", "Hungry", "Sleepy", "Noisy", "Strong", "Wild", "Beautiful"]
	const COLORS = ["Red", "Orange", "Yellow", "Green", "Purple", "Magenta", "Pink", "Blue", "Violet", "Scarlet", "Orange", "Vermilion", "Gray", "Gold", "Silver", "Bronze"];
	const ANIMALS = ["Turtle", "Chicken", "Cow", "Goat", "Gorilla", "Giraffe", "Monkey", "Bear", "Mouse", "Buffalo", "Duck", "Sheep", "Deer", "Fish", "Octopus", "Snake"];
	let rand = [];
	for (let i = 0; i < 3; i++) {
		rand.push(Math.floor(Math.random() * 16))
	}

	return ADJ[rand[0]] + COLORS[rand[1]] + ANIMALS[rand[2]];
}



socket.on('locked', function(msg, time) {
	buzzBtn.addClass('locked').removeClass('default').text(_msg("LOCKED", 'LOCKED'));
	playSound();
	mainContainer.text(msg + _msg("BUZZED", " has buzzed"));
	mainContainer.show(250);
	clear.hide();
	let ele = newEle("div", decodeDate(time) + " - " + msg + _msg("BUZZED", " buzzed"));
	$(ele).addClass("history");
	historyHolder.prepend(ele);
	$(document).attr("title", msg + _msg("BUZZED", " buzzed"));
	changeIcon(redIcon);
});

socket.on('your buzz', function(msg, time) {
	buzzed = true;
	buzzBtn.addClass('buzzed').removeClass('default').text(_msg("YOUR_BUZZ", " YOUR BUZZ")).prop("disabled", true);
	let t = 5;
	playSound();
	let div = document.createElement("div");
	$(div).text(decodeDate(time)+" - ");
	let span = document.createElement("span");
	$(span).text(msg+ _msg("BUZZED", " buzzed"));
	$(div).addClass('history').append(span);
	historyHolder.prepend(div);
	lastbuzz = Date.now();
	clear.show().text(_msg("CLEAR", "CLEAR") + " 5");
	clear.focus();
	clearTimer = setInterval(function() {
		clear.text(_msg("CLEAR", "CLEAR") + " " + (--t))
	}, 1000);
	timeoutID = setTimeout(clearbuzzer, 5000);
});

socket.on('clear', function() {
	buzzBtn.addClass('default').removeClass('buzzed').removeClass('locked').text(_msg("BUZZ", "BUZZ")).prop("disabled", false);
	mainContainer.text("").hide(350);
	clear.hide();
	$(document).attr("title", title);
	changeIcon(greenIcon);
});

socket.on('good name', function(msg) {
	name = msg;
	title = "Sokkai - " + msg + " - " + room;
	userNameDisp.text(msg);
	$(document).attr("title", title);
	let div = document.createElement("div");
	$(div).append(newEle("span",msg));
	usersHolder.prepend(div);
	usernameForm.remove();
	popup.hide();
	newLink.rel = 'shortcut icon';
	newLink.href = 'data:image/png;base64,' + greenIcon;
	document.head.appendChild(newLink);
	buzzBtn[0].addEventListener("touchend", buzz)
	finished = true;
});

socket.on('bad name', function() {
	if (emptyname) {
		name = genRandomName();
		checkname(name);
	}
	else{
		popup.show();
		usernameForm.show();
		alert(_msg("INVALID_USERNAME", "Invalid name or username already taken"));
	}
});

socket.on('get room', function(msg) {
	//console.log("'get room' response received!");
	roomnameForm.remove();
	if (localStorage.getItem("refreshed") != "true") {
		usernameForm.show();
		usernameInput.show();
	}
	usernameInput.focus();
	room = msg;
	roomNameDisp.text(msg);
});

socket.on('room full', function(msg) {
	alert(msg + _msg("ROOM_FULL", " is currently full. Try again later or choose another room."));
	
});

socket.on('send roomlist', function(msg) {
	let roomlist = JSON.parse(msg);

	if (Object.keys(roomlist).length == 0) {
		roomListHeader.text(_msg("NO_ACTIVE_ROOMS", "No active rooms"));
		roomListEl.show();
	}
	else{
		roomListEl.children().not('[disabled]').remove();
		let keys = Object.keys(roomlist);
		keys.forEach(function(e) {
			let num = roomlist[e]
			let roomname = e;
			if (e.length>23) {
				e = e.substring(0,23)+"...";
			}
			let ele = newEle("option",e+": "+num+" users");
			$(ele).attr('value', roomname);
			roomListEl.append(ele);
		});
		roomListHeader.text(_msg("ACTIVE_ROOMS", "Active rooms"));
		roomListEl.show();
	}
});

socket.on('add names', function(msg, id, isNew, time) {
	id = JSON.parse(id);
	JSON.parse(msg).forEach(function(name, index) {
		usersHolder.append("<div id='" + id[index] + "'></div>");
		$("#" + id[index]).text(name);
	});
	if (isNew) {
		let ele = newEle("div", decodeDate(time) + " - " + JSON.parse(msg)[0] + _msg("HAS_JOINED", " has joined"));
		$(ele).addClass('history');
		historyHolder.prepend(ele);
		mainContainer.text(JSON.parse(msg) + _msg("JOINED", " joined"));
		mainContainer.show(250);
		setTimeout(function() {
			mainContainer.text("").hide(350);
		}, 2500);
		}
});

socket.on('remove name', function(msg, time, id) {
	let ele = newEle("div", decodeDate(time) + " - " + msg + _msg("HAS_LEFT", " has left"));
	$(ele).addClass('history');
	historyHolder.prepend(ele);
	$("#" + id).remove();
	mainContainer.text(msg + _msg("LEFT", " left"));
	mainContainer.show(250);
	setTimeout(function() {
		mainContainer.text("").hide(350);
	}, 2500);
});

socket.on('pong',function() {
	lastping = Date.now();
});

setInterval(function() {
	socket.emit('ping');
	if (Date.now()-lastping >= 10000 && !canReload) {
		reload();
		canReload = false;
	}
},2000)