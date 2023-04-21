// TODO: Cleanup and refactor previous creator's code.
// FIXME: Sometimes connects to 'default' even if a room name is given (will usually assign a random server-side username too)

let socket = window.io.connect(
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
let soundOn = true;
let playSoundDisabled = false;
let dispInfo = true;
let dispHist = true;
let dispSettings = false;
let sound = "pop";
let audio = "sound";
let buzzed = false;
let emptyName = false;
let finished = false;
let canSpace = true;
let lastPong = Date.now();
let canReload = true;
let lastBuzz = 0;
let timeoutID;
let clearTimer;
let newLink = document.createElement('link');
let redIcon = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAJOgAACToAYJjBRwAAAAMSURBVBhXY7jIxQUAApUA5qdS4JwAAAAASUVORK5CYII="
let greenIcon = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAJOgAACToAYJjBRwAAAAMSURBVBhXY+BfLAMAAZMAz1929fMAAAAASUVORK5CYII="

const DEFAULT_NOTICE_DURATION = 2500;

let usernameInput;
let roomNameInput;
let createRoomBtn;
let joinRoomBtn;
let roomBtns;
let roomNameForm;
let usernameForm;
let notificationContainer
let buzzBtn;
let infoBtn;
let info;
let historyHolder;
let historyWrapper;
let toggleHistoryBtn;
let clear;
let popup;
let usersHolder;
let changeSoundBtn;
let toggleSoundBtn;
let reconnectBtn;
let clearHistoryBtn;
let roomNameDisp;
let userNameDisp;
let settingsContainer;
let settingsBtn;
let header;
let footer;
let languageSelector;
let submitRoomNameBtn;
let submitUsernameBtn;
let willCreateRoom = false;

function init() {

	usernameInput = $("#usernameinput")
	roomNameInput = $("#roomnameinput");
	createRoomBtn = $('#createRoomBtn');
	joinRoomBtn = $('#joinRoomBtn');
	roomBtns = $('#roomBtns');
	roomNameForm = $("#roomname");
	usernameForm = $("#username");
	notificationContainer = $("#container");
	buzzBtn = $("#buzzbutton");
	infoBtn = $("#infobutton");
	info = $("#info");
	historyHolder = $("#history");
	historyWrapper = $("#historywrapper");
	toggleHistoryBtn = $("#togglehist");
	clear = $('.clear');
	popup = $("#popup");
	usersHolder = $("#users");
	changeSoundBtn = $("#changesound");
	toggleSoundBtn = $("#togglesound");
	reconnectBtn = $("#reconnect");
	clearHistoryBtn = $("#clearhist");

	roomNameDisp = $('#roomNameDisp');
	userNameDisp = $('#userNameDisp');

	settingsContainer = $('#settingsContainer');
	settingsBtn = $('#togglesettings');
	header = $('header');
	footer = $('footer');
	languageSelector = $('#langSelector');
	submitRoomNameBtn = $('#submitRoomNameBtn');
	submitUsernameBtn = $('#submitUsernameBtn');
}

function enterName() {

	noSleep.enable();
	document.getElementById("sound").load();
	document.getElementById("sound2").load();

	submitUsernameBtn.attr('disabled', true);
	if (usernameInput.val().trim().length > 0) {
		name = usernameInput.val();
	}
	else{
		emptyName = true;
		name = genRandomName();
	}
	checkName(name);
}

function checkName(str) {
	if (str) {
		socket.emit("check name", str);
	}

	return false;
}

function getRoom(savedRoom) {
	submitRoomNameBtn.attr("disabled", true);
	if (roomNameInput.val().length > 0) {
		room = roomNameInput.val();
	} else if (savedRoom && savedRoom.length > 0) {
		room = savedRoom;
	} else {
		alert(_msg("NULL_ROOMNAME", "You must enter a room name!"));
		submitRoomNameBtn.removeAttr("disabled");
		return;
	}

	socket.emit((willCreateRoom)? "new room" : "send room", room);
}

function reload() {
	sessionStorage.setItem("name", name);
	sessionStorage.setItem("room", room);
	sessionStorage.setItem("refreshed", "true");
	noSleep.disable();
	setTimeout(function() {
		if (window.navigator.onLine && !isOffline()) {
			location.reload();
		} else {
			showNotification(_msg("DISCONNECTED", "Disconnected - Reconnecting..."), 0);
			notificationContainer.removeClass('warning').addClass('danger');
			canReload = true;
		}
	},500);
}

function isOffline() {
	const url = window.location.origin + '/isOffline.js';
	let xmlhttp = new XMLHttpRequest();
	try {
		xmlhttp.open("GET", url, false);
		xmlhttp.send(null);
	} catch (e) {
		console.error(e);
		return true;
	}

	return (xmlhttp.status !== 200 && xmlhttp.status !== 304);
}

function newEle(ele, text) {
	ele = document.createElement(ele);
	$(ele).text(text);
	return ele;
}

function changeIcon(imgSrc) {
    newLink.href='data:image/png;base64,' + imgSrc;
}

// noinspection JSDeprecatedSymbols
$(window).keydown(function(e) {

	// e.which is normalized in jQuery
	// noinspection JSDeprecatedSymbols
	if (e.which === 32) {
		if (finished) {
			e.preventDefault();
			if (canSpace) {
				if (!buzzed) {
					buzz();
				}
				else if (Date.now() - lastBuzz >= 500) {
					clearBuzzer();
				}
				canSpace = false;
			}
		}
	}
});

// noinspection JSDeprecatedSymbols
$(window).keyup(function(e) {
	// e.which is normalized in jQuery
	// noinspection JSDeprecatedSymbols
	if (e.which === 32 && finished && !canSpace) {
		canSpace = true;
	}
});

// noinspection JSDeprecatedSymbols
$(window).resize(circle);

function circle() {
	if (buzzBtn) {
		let clearHeight = clear.outerHeight(true);
		let maxHeight = (buzzBtn.parent().height() - clearHeight);
		let maxWidth = buzzBtn.parent().width();
		let dimen = (maxWidth < maxHeight) ? maxWidth : maxHeight;
		buzzBtn.css("width", dimen).css('height', dimen);
		buzzBtn.css("border-radius", dimen/2);
	}
}

function buzz() {
	if (!buzzed) {
		socket.emit("buzz", name);
	}
	return false;
}

function clearBuzzer() {
	if (Date.now() - lastBuzz >= 250) {
		clearTimeout(timeoutID);
		clearInterval(clearTimer);
		socket.emit("clear", "");
		buzzed = false;
		return false;
	}
}

function toggleSound() {
	soundOn = !soundOn;

	if (soundOn) {
		toggleSoundBtn.text(_msg("TOGGLE_SOUND_ON", "Sound: On"));
		changeSoundBtn.show();
	}
	else{
		toggleSoundBtn.text(_msg("TOGGLE_SOUND_OFF", "Sound: Off"));
		changeSoundBtn.hide();
	}
}

function playSound() {
	// TODO: Test the playSoundDisabled fix on iPads. It doesn't seem to be necessary on Android tablets...
	if (soundOn && !playSoundDisabled) {
		let el = document.getElementById(audio);
		el.play();
	}
}

function changeSound() {
	if (sound === "pop") {
		sound = "buzz";
		audio = "sound2";
		changeSoundBtn.text(_msg("TOGGLE_SOUND_BUZZ", "Sound: Buzz"));
	}
	else if (sound === "buzz") {
		sound = "pop";
		audio = "sound";
		changeSoundBtn.text(_msg("TOGGLE_SOUND_POP", "Sound: Pop"));
	}
}

function toggleInfo() {
	if (dispInfo) {
		dispInfo = false;
		footer.hide();
		infoBtn.text(_msg("TOGGLE_INFO_SHOW", "Show Info"));
	}
	else{
		dispInfo = true;
		footer.show();
		infoBtn.text(_msg("TOGGLE_INFO_HIDE", "Hide Info"));
	}
	circle();
}

function toggleSettings() {
	if (dispSettings) {
		dispSettings = false;
		popup.hide();
		settingsContainer.hide();
		settingsBtn.attr('data-icon','☰');
		header.css('z-index', 0);
	}
	else{
		dispSettings = true;
		popup.show();
		settingsContainer.show();
		settingsBtn.attr('data-icon', '×');
		header.css('z-index', 3);
	}
}

function toggleHistory() {
	if (dispHist) {
		dispHist = false;
		historyWrapper.addClass('hidden').hide();
		clearHistoryBtn.hide();
		toggleHistoryBtn.text(_msg("TOGGLE_HISTORY_SHOW", "Show History"));
	}
	else{
		dispHist = true;
		historyWrapper.removeClass('hidden').show();
		clearHistoryBtn.show();
		toggleHistoryBtn.text(_msg("TOGGLE_HISTORY_HIDE", "Hide History"));
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
	showNotification(msg + _msg("BUZZED", " has buzzed"), 0);
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
	lastBuzz = Date.now();
	clear.show().text(_msg("CLEAR", "CLEAR") + " 5");
	clear.focus();
	clearTimer = setInterval(function() {
		clear.text(_msg("CLEAR", "CLEAR") + " " + (--t))
	}, 1000);
	timeoutID = setTimeout(clearBuzzer, 5000);
});

socket.on('clear', function() {
	buzzBtn.addClass('default').removeClass('buzzed').removeClass('locked').text(_msg("BUZZ", "BUZZ")).prop("disabled", false);
	removeNotification();
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
	usernameForm.hide();
	popup.hide();
	newLink.rel = 'shortcut icon';
	newLink.href = 'data:image/png;base64,' + greenIcon;
	document.head.appendChild(newLink);
	buzzBtn[0].addEventListener("touchend", buzz)

	if (sessionStorage.getItem("refreshed") === "true") {
		sessionStorage.setItem("refreshed", "");
	}
	finished = true;
});

socket.on('bad name', function() {
	if (emptyName) {
		name = genRandomName();
		checkName(name);
	}
	else {
		popup.show();
		usernameForm.show();
		usernameInput.show().focus();
		submitUsernameBtn.removeAttr("disabled");
		alert(_msg("INVALID_USERNAME", "Invalid name or username already taken"));
	}
});

socket.on('get room', function(msg) {
	//console.log("'get room' response received!");
	roomNameForm.hide();
	room = msg;
	roomNameDisp.text(msg);
	let storedName = sessionStorage.getItem("name");
	if (sessionStorage.getItem("refreshed") !== "true") {
		usernameForm.show();
		usernameInput.show();
		usernameInput.focus();
	} else if (storedName && storedName !== "") {
		checkName(storedName);
	}
});

socket.on('room full', function(msg) {
	alert(msg + _msg("ROOM_FULL", " is currently full. Try again later or choose another room."));
	
});

socket.on('null room', function () {
	alert(_msg("NULL_ROOMNAME", "You must enter a room name!"));
	submitRoomNameBtn.removeAttr("disabled");
});

socket.on('no room', function () {
	if (sessionStorage.getItem("refreshed") !== "true") {
		alert(_msg("NO_SUCH_ROOM", "The room you inputted does not exist."));
		submitRoomNameBtn.removeAttr("disabled");
	}
});

socket.on('room taken', function () {
	alert(_msg("ROOM_TAKEN", "That room name was already taken. We generated a random room code for you instead."));
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
		showNotification(JSON.parse(msg) + _msg("JOINED", " joined"));
	}
});

socket.on('remove name', function(msg, time, id) {
	let ele = newEle("div", decodeDate(time) + " - " + msg + _msg("HAS_LEFT", " has left"));
	$(ele).addClass('history');
	historyHolder.prepend(ele);
	$("#" + id).remove();
	showNotification(msg + _msg("LEFT", " left"));
});

function showNotification(msg, duration) {
	notificationContainer.text(msg);
	notificationContainer.show(250);

	if (duration) {
		setTimeout(function() {
			notificationContainer.text("").hide(350);
		}, duration);
	} else if (duration !== 0 && !duration) {
		setTimeout(function() {
			notificationContainer.text("").hide(350);
		}, DEFAULT_NOTICE_DURATION);
	}
}


// FIXME: Check this
// FIXME: Double check iPad sound fix
function reconnect() {
	if (reconnectionBtnEnabled()) {
		reload();
	} else {
		console.warn(`Pong diff: ${Date.now() - lastPong}`);
		alert(_msg("ALREADY_CONNECTED",
			"You are already connected and don't need to reconnect. If you are experiencing issues, please refresh the page and join the room again."))
	}
}

function reconnectionBtnEnabled() {
	return (Date.now() - lastPong >= 10000);
}

function removeNotification() {
	notificationContainer.text("").hide(350);
}

socket.on('pong',function() {
	lastPong = Date.now();
});

setInterval(function() {
	socket.emit('ping');
	if (Date.now()-lastPong >= 10000 && canReload) {
		canReload = false;
		reload();
	}
},2000);

// noinspection JSDeprecatedSymbols
$(document).ready(function() {

	init();

	roomNameForm.hide();
	usernameForm.hide();
	notificationContainer.hide();
	submitRoomNameBtn.hide();
	roomNameInput.hide();
	usernameInput.hide();
	settingsContainer.hide();
	clear.hide();


	roomBtns.children('button').click(function (e) {
		willCreateRoom = (this.id === createRoomBtn[0].id);
		roomBtns.hide();
		roomNameInput.show().focus();
		submitRoomNameBtn.show().click(function() {
			getRoom();
			return false;
		});
	});

	roomNameInput.keypress(
		function(e) {
			// e.which is normalized in jQuery
			// noinspection JSDeprecatedSymbols
			if (e.which === 13) {
				getRoom();
				return false;
			}
		});

	usernameInput.keypress(
		function(e) {
			// e.which is normalized in jQuery
			// noinspection JSDeprecatedSymbols
			if (e.which === 13) {
				enterName();
				return false;
			}
		}
	);

	languageSelector.change(selectLanguage)

	circle();

	if (sessionStorage.getItem("refreshed") === "true") {
		popup.hide();

		// If the page was programmatically reloaded, then we can't play sounds until the user interacts with the screen.
		// TODO: Test the playSoundDisabled fix on iPads. It doesn't seem to be necessary on Android tablets...
		playSoundDisabled = true;
		$(document).one("click touchstart", function () {
			playSoundDisabled = false;
		});

		name = sessionStorage.getItem("name");
		room = sessionStorage.getItem("room");

		if (room !== "" && name !== "") {
			getRoom(room);
			usernameForm.hide();

			let listener = function (eventName) {
				switch (eventName) {
					case "get room":
						checkName(name);
						break;
					case "no room":
						willCreateRoom = true;
						getRoom(room);
					case "room full":
						popup.show();
						roomNameForm.show();
				}

				socket.offAny(listener);
			}

			socket.onAny(listener);
		}
	}
	else{
		roomNameForm.show();
		usernameInput.val("");
		roomNameInput.val("");
	}

});
