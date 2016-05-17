var express = require('express');
var app = express();
var server = require('http').createServer(app).listen(3000);
var io = require('socket.io').listen(server);
var term = require('term.js');
var pty = require('pty.js');
var fs = require('fs');
var utils = require('./utils');
var bodyParser = require('body-parser');
var chokidar = require('chokidar');

var resin = require("resin-sdk");

const low = require('lowdb');
const storage = require('lowdb/file-sync');

const db = low('./db.json', { storage });

app.use(express.static(__dirname + '/public'));
app.use(term.middleware());
app.use(bodyParser.urlencoded({'extended': 'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/settings', function(req, res) {
    res.sendFile(__dirname + '/public/admin.html');
    var watcher = chokidar.watch('./public/images', {ignored: /[\/\\]\./, persistent: true});
    watcher.on('add', function(path) {
      console.log('nice' + path)
      io.emit('imageAdded', path.split("/")[2])
    });
});

app.get('/api/settings/steps/:step', function(req, res) {
    utils.getStep(db, req.params.step, function(step) {
      utils.getNextStep(db, step, function(oldStep, newStep) {
        // returns current step and the name of the next step
        res.send([oldStep, newStep.name]);
      });
    })
});

app.get('/api/settings/global', function(req, res) {
  res.send(db.object.global);
});

app.post('/api/settings/save', function(req, res) {
    utils.save(db, req.body, function(){
      res.send('success');
      db.save
    })
});

app.get('/api/gallery', function(req, res) {
    // update images
    fs.readdir('./public/images', function (err, files){
        if (err) return next (err);
        res.send(files);
    });
});

app.get('/api/gallery/remove/:image', function(req, res){
    fs.unlinkSync('./public/images/' + req.params.image);
    res.send();
});

// image middleware
multiparty = require('connect-multiparty'),
multipartyMiddleware = multiparty(),
imageController = require('./controllers/imageController');

app.post('/api/upload', multipartyMiddleware, imageController.uploadFile);

io.on('connection', function(client) {

  utils.currentStep(db, function(step){
    io.emit("step", step);
  });

  utils.getSelected(db, function(data){
    io.emit("selected", data);
  })

  client.on('selected', function(selection) {
    db.object.global.selected.img = selection
    db.save
  });

  client.on('nextStep', function(step) {
    utils.getNextStep(db, step, function(oldStep, newStep) {
      processEvent(oldStep, newStep);
      io.emit("step", newStep);
      utils.updateCurrent(db, oldStep, newStep);
    });
  });

  // This handles step specific functions
  function processEvent(oldStep, newStep) {
    if (oldStep.name == "selector") {
      // handles copying the image across
      utils.selector(db, oldStep);
    }
    if (newStep.name == "build") {
      // handles tty streaming
      var script = __dirname + '/push.sh';
      var command = utils.push(db, script, db.object.global.selected);

      command.on('data', function(data) {
        io.emit('ttyData', data);
      });

      command.on('exit', function () {
        io.emit('ttyExit', null);
      });
    }
    if (newStep.name == "download") {
      // handles device data from resin
      devices = utils.devices(db, io)
      devices.on('data', function(data) {
        // do something
        io.emit('devicesData', data);
      });
      devices.on('error', function(error) {
        // do something
        console.log(error);
      });
    }
  }
});
