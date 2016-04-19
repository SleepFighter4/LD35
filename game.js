"use strict"

// Modules
var mapUtils = require('./mapUtils.js');
var ioStart = require('socket.io');
var io;

// Classes
var Player = require('./Player').Player;

// Globals
var loop;
var players = [];
var objects = [
  {angle:0, "x":915,"y":-85,"w":50,"h":50,"c":1},
  {angle:45, "x":540,"y":-1370,"w":100,"h":100,"c":2},
  {angle:0, "x":-260,"y":-1700,"w":50,"h":100,"c":3},
  {angle:0, "x":-1375,"y":-1550,"w":100,"h":50,"c":1},
  {angle:0, "x":-860,"y":-1000,"w":100,"h":100,"c":2},
  {angle:45, "x":80,"y":-1140,"w":50,"h":50,"c":3},
  {angle:45,"x":20,"y":-1030,"w":50,"h":50,"c":3}
];
var objectsAsLines = []
for (var i = 0; i < objects.length; i++) {
  console.log(i)
  var o = objects[i];
  /*var oCorners = [
    [o.x - o.w / 2, o.y - o.h / 2],
    [o.x - o.w / 2, o.y + o.h / 2],
    [o.x + o.w / 2, o.y + o.h / 2],
    [o.x + o.w / 2, o.y - o.h / 2]
  ];

  // Rotate 
  for (var j = 0; j < 4; j++) {
    oCorners[j] = [
      o.x + (oCorners[j][0] - o.x) * Math.cos(o.angle*RADIANS_PER_DEG) - (oCorners[j][1] - o.y) * Math.sin(o.angle*RADIANS_PER_DEG),
      o.y + (oCorners[j][0] - o.x) * Math.sin(o.angle*RADIANS_PER_DEG) + (oCorners[j][1] - o.y) * Math.cos(o.angle*RADIANS_PER_DEG)
    ];
  }*/

  var oCorners = [
    [o.x - o.w / 2, o.y - o.h / 2],
    [o.x - o.w / 2, o.y + o.h / 2],
    [o.x + o.w / 2, o.y + o.h / 2],
    [o.x + o.w / 2, o.y - o.h / 2]
  ];

  // Rotate 
  var a = (o.angle+90) * RADIANS_PER_DEG;
  for (var j = 0; j < 4; j++) {
    var x = o.x + (oCorners[j][0] - o.x) * Math.cos(a) - (oCorners[j][1] - o.y) * Math.sin(a)
    var y = o.y + (oCorners[j][0] - o.x) * Math.sin(a) + (oCorners[j][1] - o.y) * Math.cos(a)
    oCorners[j] = [x,y];
  }
  
  objectsAsLines.push([
    [oCorners[0],oCorners[1]],
    [oCorners[1],oCorners[2]],
    [oCorners[2],oCorners[3]],
    [oCorners[3],oCorners[0]]
  ]);
}

var scores = [];
var frameDelay = 40;
var KEY_CODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  A: 65,
  S: 83
};
var RADIANS_PER_DEG = Math.PI/180;
var vMax = 200; // px / sec
var friction = 1;
var mapCurrXLimits = [-10000,10000];
var mapCurrYLimits = [-10000,10000];
var roundStartTime = 0;
var nameID = 1;
var lapTimes = [];
var roundTimeLimit = 120; // seconds
var roundStarting = false;

//Grid variables
var gridSize = 200;
var numNegXGrids = -Math.min(Math.floor(mapCurrXLimits[0] / gridSize), 0);
var numNegYGrids = -Math.min(Math.floor(mapCurrYLimits[0] / gridSize), 0);
var lastXGridIndex = Math.ceil((mapCurrXLimits[1] - mapCurrXLimits[0]) / gridSize);
var lastYGridIndex = Math.ceil((mapCurrYLimits[1] - mapCurrYLimits[0]) / gridSize);
var objectIndexGrid = sortObjectsIntoGrids(objects);
var playerIndexGrid = setupObjectGrids(players);

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
  handleRounds();
  sendUpdates();
}

//Player Colour
var playerColour=1;

function initialiseClient(socket) {
  var player = new Player(socket.id, "Player " + (nameID++));
  player.c = playerColour;
  if(playerColour > 3){playerColour = 1;}
  else {playerColour++;}
  players.push(player);
  log('A user connected.');
  logNumUsers();
  socket.emit('ping', '');
  socket.emit('map', mapUtils.map);
  socket.emit('server message', "Welcome.");
  socket.emit('lap times', lapTimes);
  chooseMode(socket, player);

  socket.on('key update', function(keyState) {
    if (typeof(player) != 'undefined') {
      player.keyState = keyState;
      player.lastMovedTime = Date.now();
    }
  });  
  socket.on('canvas size', function(cs) {
    player.canvasSize.x = (cs.x && cs.x > 0 && cs.x < 4000) ? cs.x : 1980;
    player.canvasSize.y = (cs.y && cs.y > 0 && cs.y < 2000) ? cs.y : 1080;
  });
  socket.on('ping response', function(data) {
    if (typeof(player) != 'undefined') {
      player.ping = Date.now() - player.pingStart;
      setTimeout(function(){socket.emit('ping',''); player.pingStart = Date.now();},2000);
    }
  });
  socket.on('disconnect', function() {
    if (typeof(player) != 'undefined') {
      players.splice(players.indexOf(player), 1);
      log('A user disconnected.');
      logNumUsers();
      if (players.length == 1) {
        socket.emit('server message', "Entering single player mode.");
      }
    }
  });
}

function logNumUsers() {
  if (players.length == 1) log('There is now 1 user.');
  else log('There are now ' + (players.length).toString() + ' users.');
}

function chooseMode(socket, player) {
  if (players.length == 2) {
    io.sockets.emit('server message', "Entering multiplayer mode.");
    roundStartTime = 0;
  } else if (players.length == 1) {
    io.sockets.emit('server message', "Entering single player mode.");
    roundStarting = false;
  } else if (players.length > 2) {
    player.participating = false;
    socket.emit('round in progress', Date.now() - roundStartTime);
  }
}

function movePlayers() {
  var acceleration = 300;
  var rotationSpeed = 2;
  var deformationSpeed = 100;
  
  playerIndexGrid = setupObjectGrids();
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    if (!p.participating || roundStarting) continue;
    var delta = (Date.now() - p.lastMovedTime) / 1000.0;
    var rotationDirection = 0;
    var forwardAcc = 0;

    if (p.keyState[KEY_CODES.LEFT]) {
      rotationDirection = -rotationSpeed;
    } else if (p.keyState[KEY_CODES.RIGHT]) {
      rotationDirection = +rotationSpeed;
    }

    if (p.keyState[KEY_CODES.UP]) {
      forwardAcc = acceleration;
    } else if (p.keyState[KEY_CODES.DOWN]) {
      forwardAcc = -acceleration;
    }

    if (p.keyState[KEY_CODES.A]) {
      p.w += delta * deformationSpeed;
      p.h -= delta * deformationSpeed;
    } else if (p.keyState[KEY_CODES.S]) {
      p.w -= delta * deformationSpeed;
      p.h += delta * deformationSpeed;
    }
    p.w = Math.min(Math.max(p.w, 20), 130);
    p.h = Math.min(Math.max(p.h, 20), 130);

    // Collisions
    /*for (var i in objects) {
      if (collides(objects[i], p)) {
        console.log("Player collision with:", objects[i]);
        // TODO: divert player
      }
    }*/

    //Phil's terrible drift stuff
    var drift;
    var velocity = Math.sqrt(p.vX*p.vY);
    if(velocity < 200) drift = 1;
    else if(velocity > 400) drift = 0.2;
    else drift = 0.5;

    var temp = {
      "p.angle":p.angle,
      "p.vX":p.vX,
      "p.vY":p.vY,
      "p.x":p.x,
      "p.y":p.y
    }

    p.angle = (p.angle + rotationDirection * p.rotationSpeed * delta) % 360;
    if (p.angle < 0) p.angle += 360;
    var engineAccelerationX = forwardAcc * Math.cos(RADIANS_PER_DEG * p.angle);
    var engineAccelerationY = forwardAcc * Math.sin(RADIANS_PER_DEG * p.angle);
    p.vX += engineAccelerationX * delta;
    p.vY += engineAccelerationY * delta;
    p.vX *= (1 - (drift * delta)) // Dampening
    p.vY *= (1 - (drift * delta)) // Dampening
    if (Math.abs(p.vY) < 0.1) p.vY = 0;
    if (Math.abs(p.vX) < 0.1) p.vX = 0;
    p.x += p.vX * delta;
    p.y += p.vY * delta;
    p.collisionPoints = [];
    var pLines = getPlayerLines(p);    
    if (checkMap(p, delta, pLines) || checkObjects(p, delta, pLines)) {
    
      p.x = temp['p.x'];
      p.y = temp['p.y'];
      p.angle = temp['p.angle'];
      p.vX = temp['p.vX'];
      p.vY = temp['p.vY'];
    }

    p.lastMovedTime = Date.now();
    p.xGrid = Math.floor(p.x / gridSize) + numNegXGrids;
    p.yGrid = Math.floor(p.y / gridSize) + numNegYGrids;
    playerIndexGrid[p.xGrid][p.yGrid].push(i);
  }
}

function getPlayerLines(p) {
  console.log('pl')
    var pCorners = [
    [p.x - p.w / 2, p.y - p.h / 2],
    [p.x - p.w / 2, p.y + p.h / 2],
    [p.x + p.w / 2, p.y + p.h / 2],
    [p.x + p.w / 2, p.y - p.h / 2]
  ];

  // Rotate 
  var a = (p.angle+90) * RADIANS_PER_DEG;
  for (var i = 0; i < 4; i++) {
    var x = p.x + (pCorners[i][0] - p.x) * Math.cos(a) - (pCorners[i][1] - p.y) * Math.sin(a)
    var y = p.y + (pCorners[i][0] - p.x) * Math.sin(a) + (pCorners[i][1] - p.y) * Math.cos(a)
    pCorners[i] = [x,y];
  }

  p.corners = pCorners;

  var pLines = [
    [pCorners[0], pCorners[1]],
    [pCorners[1], pCorners[2]],
    [pCorners[2], pCorners[3]],
    [pCorners[3], pCorners[0]]
  ];
  return pLines;
}

function checkObjects(p, delta, pLines) {
  console.log('co')
  var coll = false;
  for (var i = 0; i < pLines.length; i++) {
    for (var j = 0; j < objectsAsLines.length; j++) {
      for (var k = 0; k < objectsAsLines[j].length; k++) {
        var intersection = mapUtils.lineIntersection(
          pLines[i][0][0],
          pLines[i][0][1],
          pLines[i][1][0],
          pLines[i][1][1],
          objectsAsLines[j][k][0][0],
          objectsAsLines[j][k][0][1],
          objectsAsLines[j][k][1][0],
          objectsAsLines[j][k][1][1]
        )

        if (intersection.onLine1 && intersection.onLine2) {
          p.collisionPoints.push([intersection.x,intersection.y]);
          // Only keep the velocity in the direction of the line the player hit.
          console.log('Object collision');
          var magnitude = Math.sqrt(Math.pow(p.vX,2) + Math.pow(p.vY,2));
          //if (!col)
          coll= true;
          //p.vX = magnitude * Math.cos(Math.atan2(objectsAsLines[j][k][0][1] - objectsAsLines[j][k][1][1], objectsAsLines[j][k][0][0] - objectsAsLines[j][k][1][0]));
          //p.vY = magnitude * Math.sin(Math.atan2(objectsAsLines[j][k][0][1] - objectsAsLines[j][k][1][1], objectsAsLines[j][k][0][0] - objectsAsLines[j][k][1][0]));
        }
      }
    }
  }
  return coll;
}

function checkMap(p, delta, pLines) {
  console.log('cm')
  var mapLines = mapUtils.mapLines;
  var coll = false;
  for (var i = 0; i < pLines.length; i++) {
    for (var j = 0; j < mapLines.length; j++) {
      var intersection = mapUtils.lineIntersection(
        pLines[i][0][0],
        pLines[i][0][1],
        pLines[i][1][0],
        pLines[i][1][1],
        mapLines[j][0][0],
        mapLines[j][0][1],
        mapLines[j][1][0],
        mapLines[j][1][1]
      )

      if (intersection.onLine1 && intersection.onLine2) {
        
        p.collisionPoints.push([intersection.x,intersection.y]);
        // Only keep the velocity in the direction of the line the player hit.
        console.log('Map collision');
        var magnitude = Math.sqrt(Math.pow(p.vX,2) + Math.pow(p.vY,2));
        coll = true;
        //p.vX = magnitude * Math.cos(Math.atan2(mapLines[j][0][1] - mapLines[j][1][1], mapLines[j][0][0] - mapLines[j][1][0]));
        //p.vY = magnitude * Math.sin(Math.atan2(mapLines[j][0][1] - mapLines[j][1][1], mapLines[j][0][0] - mapLines[j][1][0]));
      }
    }
  }
  return coll;
}

/*
 * input:  2 objects with {x,y, w,h, angle}
 * output: true if objects collide
 */
function collides(o1, o2) {
  var o1cornerinfo = {
        dist: Math.sqrt(o1.w/2 + o1.h/2),
        angle: Math.atan(o1.w / o1.h) + o1.angle
      },
      o2cornerinfo = {
        dist: Math.sqrt(o2.w/2 + o2.h/2),
        angle: Math.atan(o2.w / o2.h) + o2.angle
      };

  var o1corners = [
    { x: o1.x + o1cornerinfo.dist * Math.cos((  0 + o1cornerinfo.angle) * RADIANS_PER_DEG),
      y: o1.y + o1cornerinfo.dist * Math.sin((  0 + o1cornerinfo.angle) * RADIANS_PER_DEG) },
    { x: o1.x + o1cornerinfo.dist * Math.cos((180 - o1cornerinfo.angle) * RADIANS_PER_DEG),
      y: o1.y + o1cornerinfo.dist * Math.sin((180 - o1cornerinfo.angle) * RADIANS_PER_DEG) },
    { x: o1.x + o1cornerinfo.dist * Math.cos((180 + o1cornerinfo.angle) * RADIANS_PER_DEG),
      y: o1.y + o1cornerinfo.dist * Math.sin((180 + o1cornerinfo.angle) * RADIANS_PER_DEG) },
    { x: o1.x + o1cornerinfo.dist * Math.cos((360 - o1cornerinfo.angle) * RADIANS_PER_DEG),
      y: o1.y + o1cornerinfo.dist * Math.sin((360 - o1cornerinfo.angle) * RADIANS_PER_DEG) },
  ];

  var o2corners = [
    { x: o2.x + o2cornerinfo.dist * Math.cos((  0 + o2cornerinfo.angle) * RADIANS_PER_DEG),
      y: o2.y + o2cornerinfo.dist * Math.sin((  0 + o2cornerinfo.angle) * RADIANS_PER_DEG) },
    { x: o2.x + o2cornerinfo.dist * Math.cos((180 - o2cornerinfo.angle) * RADIANS_PER_DEG),
      y: o2.y + o2cornerinfo.dist * Math.sin((180 - o2cornerinfo.angle) * RADIANS_PER_DEG) },
    { x: o2.x + o2cornerinfo.dist * Math.cos((180 + o2cornerinfo.angle) * RADIANS_PER_DEG),
      y: o2.y + o2cornerinfo.dist * Math.sin((180 + o2cornerinfo.angle) * RADIANS_PER_DEG) },
    { x: o2.x + o2cornerinfo.dist * Math.cos((360 - o2cornerinfo.angle) * RADIANS_PER_DEG),
      y: o2.y + o2cornerinfo.dist * Math.sin((360 - o2cornerinfo.angle) * RADIANS_PER_DEG) },
  ];

  var o1previouscorner = o1corners[o1corners.length-1];
  for (var i in o1corners) {
    var o1currentcorner = o1corners[i];

    var normal = {
      x:  o1currentcorner.x - o1previouscorner.x,
      y: -o1currentcorner.y - o1previouscorner.y
    };
    var o1proj = project(o1corners, normal);
    var o2proj = project(o2corners, normal);

    if (o1proj.max < o2proj.min || o2proj.max < o1proj.min)
      return false;

    o1previouscorner = o1currentcorner;
  }

  var o2previouscorner = o2corners[o2corners.length-1];
  for (var i in o2corners) {
    var o2currentcorner = o2corners[i];

    var normal = {
      x:  o2currentcorner.x - o2previouscorner.x,
      y: -o2currentcorner.y - o2previouscorner.y
    };

    var o1proj = project(o1corners, normal);
    var o2proj = project(o2corners, normal);

    if (o1proj.max < o2proj.min || o2proj.max < o1proj.min)
      return false;

    o1previouscorner = o1currentcorner;
  }

  return true;
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function project(corners, axis) {
  var min = dot(axis, corners[0]);
  var max = min;
  for (var i = 1; i < corners.length; i++) {
    var p = dot(axis, corners[i]);
    if (p < min) {
      min = p;
    } else if (p > max) {
      max = p;
    }
  }
  return {min: min, max: max};
}

function handleRounds() {
  if (players.length <= 1) return;
  if (((Date.now()-roundStartTime)/1000 > roundTimeLimit || lapTimes.Length == players.length) && !roundStarting) {
    // Round has hit time limit or all players have finished.
    prepareNewRound();
  }
  if (!roundStarting) {
    for (var i = 0; i < players.length; i++) {
      var p = players[i]
      var playerFinished = 0;
      if (playerFinished) {
        lapTimes.push({
          "name": p.name,
          "time": (Date.now()-roundStartTime)/1000
        });
        io.sockets.emit('lap times', lapTimes);
      }
      // If player crosses finish line, add lap time to a "previous lap times" board.
      // If last player finished round, spawn players again.
    }
  }
}

function prepareNewRound() {
  log("Round starting.");
  var startCountdownTime = 1; 
  setTimeout(startRound, startCountdownTime * 1000);
  io.sockets.emit('round starting', startCountdownTime);
  roundStarting = true;
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    p.x = 30 + i * 30;
    p.y = -100;
    p.w = 20;
    p.h = 100;
    p.angle = -90.0;
    // Stop them from moving.
  }
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    var socket = io.sockets.connected[p.id];
    socket.emit('player', p);
    var objsToSend = {
      "players": players,
      "objects": objects,
      "scores": scores
    }
    socket.emit('game data', objsToSend);
  }
}

function startRound() {
  log("Round started.");
  roundStartTime = Date.now();
  roundStarting = false;
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    p.x = 30 + i * 30;
    p.y = -100;
    p.w = 20;
    p.h = 100;
    p.angle = -90.0;
    p.lastMovedTime = Date.now();
    p.participating = true;
  }
  lapTimes = [];
  io.sockets.emit('lap times', lapTimes);
  io.sockets.emit('round started', roundTimeLimit);
}

function setupObjectGrids() {
  var grids = [];
  for (var w = mapCurrXLimits[0]; w <= mapCurrXLimits[1]+1; w += gridSize) {
    var gridCol = [];
    for (var h = mapCurrYLimits[0]; h <= mapCurrYLimits[1]+1; h += gridSize) {
      gridCol.push([]);
    }
    grids.push(gridCol);
  }
  numNegXGrids = -Math.min(Math.floor(mapCurrXLimits[0] / gridSize), 0);
  numNegYGrids = -Math.min(Math.floor(mapCurrYLimits[0] / gridSize), 0);
  return grids;
}

function sortObjectsIntoGrids(objects) {
  // Bin sort object indices into grids based on object location.
  var grids = setupObjectGrids(objects);
  for (var i = 0; i < objects.length; i++) {
    grids[Math.floor(objects[i].x / gridSize) + numNegXGrids][Math.floor(objects[i].y / gridSize) + numNegYGrids].push(i);
  }
  return grids;
}

function getObjectsForPlayer(p, playerIndexGrid, objectIndexGrid) {
  var playersToSend = [];
  var objectsToSend = [];

  var startXGrid = Math.max(Math.floor((p.x - (p.canvasSize.x / 2)) / gridSize) + numNegXGrids, 0);
  var endXGrid = Math.min(Math.floor((p.x + (p.canvasSize.x / 2)) / gridSize) + numNegXGrids, lastXGridIndex);
  var startYGrid = Math.max(Math.floor((p.y - (p.canvasSize.y / 2)) / gridSize) + numNegYGrids, 0);
  var endYGrid = Math.min(Math.floor((p.y + (p.canvasSize.y / 2)) / gridSize) + numNegYGrids,lastYGridIndex);

  for (var x = startXGrid; x <= endXGrid; x++) {
    for (var y = startYGrid; y <= endYGrid; y++) {
      for (var i = 0; i < playerIndexGrid[x][y].length; i++) {
        var p = players[playerIndexGrid[x][y][i]];
        if (typeof(p) != 'undefined') {
          playersToSend.push(players[playerIndexGrid[x][y][i]]);
        } else {
          log('WARNING: Player in grid is undefined.');
        }
      }
      for (var i = 0; i < objectIndexGrid[x][y].length; i++) {
        var o = objects[objectIndexGrid[x][y][i]];
        if (typeof(o) != 'undefined') {
          objectsToSend.push(objects[objectIndexGrid[x][y][i]]);
        } else {
          log('WARNING: Object in grid is undefined.');
        }
      }
    }
  }
  return {
    players: playersToSend,
    objects: objectsToSend
  };
}

function sendUpdates() {
  for (var i = 0; i < players.length; i++) {
    var p = players[i];

    //var objsToSend = getObjectsForPlayer(p, playerIndexGrid, objectIndexGrid);
    //objsToSend['scores'] = scores;

    var objsToSend = {
      "players": players,
      "objects": objects,
      "scores": scores
    }

    // Get socket of player.
    var socket = io.sockets.connected[p.id];
    if (typeof(socket) != 'undefined') {
      // Send the player's individual object.
      if (p.participating) socket.emit('player', p);
      else socket.emit('player', players[0]);
      // Send the rest content requried for drawing the game.
      socket.emit('game data', objsToSend);
    }
  }
}
