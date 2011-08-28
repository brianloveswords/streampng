var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    metapng = require('../metapng.js'),
    path = require('path');

var testfile = path.join(__dirname, './pngs/test.png');
vows.describe('metapng').addBatch({
  'Should be able to read': { 
    topic: function(){ return metapng.read },
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
  },
  'Should be able to write': { 
    topic: function(){
      return metapng.write(testfile, 'omg', 'ponies');
    },
    'and get a new buffer back': function(buffer){
      assert.ok(Buffer.isBuffer(buffer));
      assert.equal(metapng.read(buffer).length, 1);
    },
  }
}).export(module);