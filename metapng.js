var fs = require('fs'),
    util = require('./lib/util.js');

var ByteArray = function(bytes){
  if (!(this instanceof ByteArray)) return new ByteArray(bytes);
  if (bytes) { this.pushBytes(bytes); }
}
ByteArray.prototype = new Array;
ByteArray.prototype.is = function(otherArray){
  for (var i = otherArray.length; i > 0; --i) 
    if (otherArray[i] !== this[i]) return false;
  return true;
}
ByteArray.prototype.to32Int = function() {
  var x = 3, intsum = 0;
  for (var i = 0; i <= x; i++)
    intsum += Math.pow(256, (x-i)) * this[i];
  return intsum;
}
ByteArray.prototype.pushBytes = function(bytes) {
  Array.prototype.push.apply(this, Array.prototype.slice.call(Buffer(bytes)));
}

// PNG magic number
const MAGIC_NUMBER = ByteArray([137, 80, 78, 71, 13, 10, 26, 10]);
var Reader = function(source, keyword, callback) {
  if (!(this instanceof Reader)) return new Reader(source, keyword, callback);
  if ('function' === typeof keyword) callback = keyword, keyword = null;
  this.source = source;
  this.keyword = keyword;
  this.callback = callback;
  this.data = this.getContents(source);
  this.cursor = 0;
  this.async = ('function' === typeof callback)
}
Reader.prototype.getContents = function(source) {
  if (Buffer.isBuffer(source))
    return source;
  if ('number' === typeof source) {
    var len = fs.fstatSync(source).size;
    var buf = Buffer(len);
    return fs.readSync(source, buf, 0, len);
  }
  if ('string' === typeof source) {
    return fs.readFileSync(source);
  }
  throw "unrecognized source. must be filename, file descriptor or buffer";
}
Reader.prototype.get_tEXts = function() {
  return [1,2,3];
}


var __read = function(src, key, cb){ return Reader(src, key, cb).get_tEXts() };
exports.read = exports.readSync = __read;

/*

// global seek cursor
var CURSOR = 0

// get that data
var DATA = fs.readFileSync(FILENAME);

// make sure first 8 bytes are [137 80 78 71 13 10 26 10]
if (!MAGIC.is(DATA.slice(0, (CURSOR += 8)))) throw "not a png";

// begin parsing at 8th byte
var IHDR_ENDPOS = null;
var tEXt_POS = [];

var eat = function(){
  var cursor = CURSOR,
      len, type, data, crc;
  // order is important here.
  len = ByteArray(DATA.slice(cursor, (cursor += 4)));
  type = DATA.slice(cursor, (cursor += 4)).toString();
  data = DATA.slice(cursor, (cursor += len.to32Int()));
  crc = ByteArray(DATA.slice(cursor, (cursor += 4)));
  
  console.log('\n--BEGIN CHUNK');
  console.dir(len);
  console.dir(type);
  console.dir(data);
  console.dir(crc);
  
  // keep the location of just after the IHDR for second pass.  
  switch (type) {
    case 'IHDR': IHDR_ENDPOS = cursor; break;
    case 'tEXt': tEXt_POS.push(cursor); break;
  }
  
  // change global cursor.
  CURSOR = cursor;
}
while (CURSOR < DATA.length) { eat(); }


// bail if existing tEXt, could be a badge
if (tEXt_POS.length > 0) { throw "don't know how to deal with existing tEXt yet"; }

var badge_tEXt = function(bData) {
  var type = Buffer('tEXt'),
      keyword = 'author',
      rawBadge = JSON.stringify(bData),
      checksum = null,
      pBadge = ByteArray(rawBadge),
      data = ByteArray(),
      chunk = ByteArray();

  data.pushBytes(type);
  data.pushBytes(keyword);
  // don't forget the null
  data.push(0);
  data.pushBytes(pBadge);
  // CRC does include type...
  checksum = hex32(refcrc(data));
    
  // ... but length doesn't
  chunk.pushBytes(intToBytes(data.length-4));
  chunk.pushBytes(data);
  chunk.pushBytes(intToBytes(checksum));
  
  return Buffer(chunk);
}

var intToBytes = function(integer){
  var hex = hex32(integer);
  return ByteArray([
    parseInt(hex.slice(0,2), 16),
    parseInt(hex.slice(2,4), 16),
    parseInt(hex.slice(4,6), 16),
    parseInt(hex.slice(6,8), 16)
  ])
}

var badgeData = badge_tEXt({
  recipient: 'bimmy@example.com',
  evidence: '/bimmy-badge.json',
  expires: '2040-08-13',
  issued_on: '2011-08-23',
  badge: {
    version: 'v0.5.0',
    name: 'HTML5',
    description: 'For rocking in the free world',
    image: '/html5.png',
    criteria: 'http://example.com/criteria.html',
    issuer: {
      name: 'p2pu',
      org: 'school of webcraft',
      contact: 'admin@p2pu.org',
      url: 'http://p2pu.org/schools/sow'
    }
  }
})

var fstream = fs.createWriteStream(OUTPUT);
fstream.write(DATA.slice(0, IHDR_ENDPOS));
fstream.write(badgeData);
fstream.end(DATA.slice(IHDR_ENDPOS));
*/