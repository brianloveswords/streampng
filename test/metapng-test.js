var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    metapng = require('../metapng.js')

// sync read -- explicit
// var tEXt = [];
// tEXt = metapng.readSync(filename, [keyword])
// tEXt = metapng.readSync(fd, [keyword])
// tEXt = metapng.readSync(buffer, [keyword])

// sync read -- implicit
// tEXt = metapng.read(filename, [keyword])
// tEXt = metapng.read(fd, [keyword])
// tEXt = metapng.read(buffer, [keyword])

// async read
// metapng.read(filename, [keyword], this.callback)
// metapng.read(fd, [keyword], this.callback)
// metapng.read(buffer, [keyword], this.callback)

var testfile = 'test.png';
vows.describe('metapng').addBatch({
  'Should be able to read synchronously explicitly': { 
    topic: function(){ return metapng.readSync },
    'by filename': function(reader){
      var filename = testfile;
      assert.isArray(reader(filename));
    },
    'by file descriptor': function(reader){
      var fd = fs.openSync(testfile, 'r');
      assert.isArray(reader(fd));
    },
    'by buffer': function(reader){
      var buffer = fs.readFileSync(testfile);
      assert.isArray(reader(buffer));
    },
  }
}).export(module);