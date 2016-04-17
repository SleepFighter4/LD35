"use strict"

// Modules
var app = require('express')();
var http = require('http').Server(app);
var url = require('url');
var fs = require('fs');
var path = require('path');
var game = require('./game.js');

// Globals
var publicContentFolder = path.sep + 'public';
var sitePrefix = fs.realpathSync('.') + publicContentFolder;
var OK = 200, Redirect = 307, NotFound = 404, BadType = 415, Error = 500;
var port = 4000;

http.listen(port, function() {
  log('listening on *:' + port.toString());
  game.run(http);
});

app.get('/', function(req, res) {
  res.sendFile('public/index.html', {root:'.'});
});

app.get('/favicon.ico', function(req, res) {
  res.sendFile('public/images/favicon.ico', {root:'.'});
});

app.get(/^(.+)$/, function(req, res) {
  var filename = url.parse(req.url).pathname;
  if (!inSite(sitePrefix + filename)) return fail(res, NotFound);
  res.sendFile(publicContentFolder + filename, {root:'.'});
});

function fail(response, code) {
  response.writeHead(code);
  response.end();
}

function startsWith(s,prefix) {
  return s.indexOf(prefix) == 0;
}

function inSite(file) {
  var real;
  try {
    real = fs.realpathSync(file);
  }
  catch (err) {
    log("WARNING: Trying to access a file not in the site: "+file);
    log(err.message);
    return false;
  }
  return startsWith(real, sitePrefix);
}

function log(obj) {
  console.log((new Date()).toLocaleTimeString() + ": " + obj.toString());
}