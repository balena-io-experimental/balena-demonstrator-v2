var fs = require('fs-extra')
var childProcess = require('child_process')
var pty = require('pty.js')
var resin = require("resin-sdk")()
var EventEmitter = require('events')

module.exports = {
  selector: function(db, step) {
    // TODO allow this to handle app selection as well
    fs.copy(__dirname + '/public/images/'+ db.object.global.selected.img, '../' + db.object.global.selected.app + '/images/image.png', function (err) {
      if (err) return console.error(err)
      console.log("code change success!")
    }) // copy image file
  },
  getSelected: function(db, cb) {
    cb(db.object.global.selected);
  },
  push: function(db, script, selected) {
    console.log(script, db.object.global.selected.app)
    return pty.spawn("bash", [script, db.object.global.selected.app, "init"], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
    });
  },
  updateCurrent: function(db, oldStep, newStep) {
    db('steps').find({ name: newStep.name }).active = true;
    db('steps').find({ name: oldStep.name }).active = false;
  },
  getStep: function(db, stepName, cb) {
    cb(db('steps').find({ name: stepName }))
  },
  currentStep: function(db, cb) {
    var step = db('steps').filter({active: true})[0]
    if (step) {
      cb(step);
    } else {
      cb(db('steps').find({name: "start"}));
    }
  },
  getNextStep: function(db, currentStep, cb) {
    var index = db('steps').findIndex({ name: currentStep.name }) + 1;
    if (index == db.object.steps.length) {
      cb(currentStep, db.object.steps[0])
    } else {
      cb(currentStep, db.object.steps[index])
    }
  },
  save: function(db, newData, cb) {
    if (newData.settings == 'global') {
      cb(db.object[newData.settings] = newData.data)
    } else {
      cb(db(newData.settings).chain().find({name: newData.data.name }).assign(newData.data).value());
    }
  },
  devices: function(db, client) {
    var email = process.env.RESIN_EMAIL;
    var pw = process.env.RESIN_PASSWORD;

    var emitter = new EventEmitter();
    // authenticate with resin sdk
    var credentials = { email:email, password:pw };

    resin.auth.login(credentials, function(error) {
      if (error != null) {
        return emitter.emit('error', error);
      }
      console.log("success authenticated with resin API");
      var poller = setInterval(function(){
        resin.models.device.getAllByApplication(db.object.global.resin.app,function(error, devices) {
          if (error != null) {
            return emitter.emit('error', error);
          }

          return emitter.emit('data', devices);

        });
      }, 1000);


      client.on('haltResinPoll', function(data){
        console.log("haltResinPoll");
        // stop polling when the client moves to next step
        clearInterval(poller);
      });
    });

    return emitter;
  }
};
