var fs = require('fs'),
    util = require('./lib/util.js'),
    ByteArray = util.ByteArray;

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

const PNG_MAGIC_NUMBER = ByteArray([137, 80, 78, 71, 13, 10, 26, 10]);
var Reader = function(source) {
  if (!(this instanceof Reader)) return new Reader(source);
  this.source = source;
  this.data = null;
  this.cursor = 0;
  this.chunks = null;
}
Reader.prototype.getContents = function() {
  var source = this.source;
  if (Buffer.isBuffer(source))
    return this.data = source;
  else if ('number' === typeof source) {
    var len = fs.fstatSync(source).size;
    var buf = Buffer(len);
    fs.readSync(source, buf, 0, len);
    return this.data = buf;
  }
  else if ('string' === typeof source) {
    return this.data = fs.readFileSync(source);
  }
  throw "unrecognized source. must be filename, file descriptor or buffer";
}
Reader.prototype.rewind = function(len){
  if (!len) this.cursor = 0;
  else { this.cursor -= len }
  if (this.cursor < 0) this.cursor = 0;;
}
Reader.prototype.eat = function(len) {
  var buf = this.peek(len);
  this.cursor += len;
  return buf;
}
Reader.prototype.peek = function(len) {
  if (!this.data) this.getContents();
  return this.data.slice(this.cursor, (this.cursor + len));
}
Reader.prototype.readChunks = function() {
  var magic_nom_nom, chunk;
  this.chunks = [];
  this.rewind();
  magic_nom_nom = this.eat(8)
  if (!PNG_MAGIC_NUMBER.is(magic_nom_nom)) throw "this is not a PNG";
  while (chunk = this.readNextChunk()) this.chunks.push(chunk)
  return this.chunks;
}
Reader.prototype.readNextChunk = function() {
  if (this.cursor === this.data.length) return null;
  // order is important here.
  var start = this.cursor
    , len = ByteArray(this.eat(4)).to32Int()
    , type = this.eat(4).toString()
    , data = this.eat(len)
    , crc = this.eat(4)
    , end = this.cursor
  return {start: start, len: len, type: type, data: data, crc: crc, end: end}
}
Reader.prototype.findByType = function(type) {
  if (!this.chunks) this.readChunks()
  return this.chunks.filter(function(chunk){
    return (chunk.type === type);
  });
}


function Writer(source) {
  if (!(this instanceof Writer)) return new Writer(source);
  Reader.call(this, source)
}
Writer.prototype = new Reader;
Writer.prototype.chunk = function(type, data) {
  var body = ByteArray(),
      chunk = ByteArray();

  body.pushBytes(type);
  body.pushBytes(data);
    
  chunk.pushBytes(util.intToBytes(data.length));
  chunk.pushBytes(body);
  chunk.pushBytes(util.intToBytes(util.crc32(body)));
  
  return Buffer(chunk);
}
Writer.prototype.tEXt = function(keyword, data) {
  var combined = ByteArray(keyword);
  combined.push(0);
  combined.pushBytes(data);
  return this.chunk('tEXt', combined);
}

exports.Reader = Reader;
exports.read = function(src, key){
  var textChunks = Reader(src).findByType('tEXt');
  return textChunks;
};
exports.write = function(src, key, data) {
  var writer = Writer(src);
  var ihdr_end = writer.findByType('IHDR').pop().end;
  var chunk = writer.tEXt(key, data);
  var len = writer.data.length + chunk.length;
  
  var buf = Buffer(len);
  writer.data.copy(buf, 0, 0, ihdr_end);
  chunk.copy(buf, ihdr_end)
  writer.data.copy(buf, (ihdr_end + chunk.length), ihdr_end)
  return buf;
}
/*
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
