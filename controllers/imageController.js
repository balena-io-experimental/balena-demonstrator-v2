imageController = function() {};
var fs = require('fs');

imageController.prototype.uploadFile = function(req, res) {
    // We are able to access req.files.file thanks to
    saveTemp(req);
}

function saveTemp(req) {
  // get the temporary location of the file
  var tmp_path = req.files.file.path;
  // set where the file should actually exists - in this case it is in the "images" directory
  var target_path = './public/images/' + req.files.file.name;
  // move the file from the temporary location to the intended location
  fs.rename(tmp_path, target_path, function(err) {
      if (err) throw err;
      // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
      fs.unlink(tmp_path, function() {
          if (err) throw err;
          return 'File uploaded to: ' + target_path + ' - ' + req.files.file.size + ' bytes';
      });
  });
}

module.exports = new imageController();
