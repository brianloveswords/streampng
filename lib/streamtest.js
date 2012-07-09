var fs = require('fs');
var filename = 'test.png';
var stream = fs.createReadStream(filename);
stream.on('data', function (data) {
  console.log('data event: %d bytes', data.length);
});
stream.on('end', function () {
  console.log('stream ended');
});


