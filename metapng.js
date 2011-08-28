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
  return this;
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

  body
    .pushBytes(type)
    .pushBytes(data);
  chunk
    .pushBytes(util.intToBytes(data.length))
    .pushBytes(body)
    .pushBytes(util.intToBytes(util.crc32(body)));
  
  return Buffer(chunk);
}
Writer.prototype.tEXt = function(keyword, data) {
  return this.chunk('tEXt', [keyword, data].join('\u0000'));
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
