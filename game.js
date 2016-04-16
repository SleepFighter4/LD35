"use strict"

// Modules
var ioStart = require('socket.io');
var io;

// Classes
var Player = require('./Player').Player;

// Globals
var loop;
var players = [];
var objects = [];
var scores = [];
var frameDelay = 40;

function log(obj) {
	console.log((new Date()).toLocaleTimeString() + ": " + obj.toString());
}

function run(http) {
	var loop = setInterval(gameLoop, frameDelay);
	io = ioStart(http);
	io.on('connection', initialiseClient);
	log("Game started.");
}
exports.run = run;

function gameLoop() {
	movePlayers();
	sendUpdates();
}

function initialiseClient(socket) {
	var player = new Player(socket.id);
	players.push(player);
	socket.on('disconnect', function() {
		if (typeof(player) != 'undefined') {
			players.splice(players.indexOf(player), 1);
			if (players.length == 1) log('A user disconnected. There is now 1 user.');
			else log('A user disconnected. There are now '+(players.length).toString()+' users.');
		}
	});
}

function movePlayers() {
	// Movement stub.
	for (var i = 0; i < players.length; i++) {
		var p = players[i];
	}
}

function sendUpdates() {
	// This will be content sent to every player so they can draw the game.
	// Over time this will change to a minimal subset of the players and objects arrays.
	var objsToSend = {
		players: players,
		objects: objects,
		scores: scores
	};

	for (var i = 0; i < players.length; i++) {
		var p = players[i];
		// Get socket of player.
		var socket = io.sockets.connected[p.id];
		if (typeof(socket) != 'undefined') {
			// Send the player's individual object.
			socket.emit('game data', p);
			// Send the rest content requried for drawing the game.
			socket.emit('game data', objsToSend);
		}
	}
}