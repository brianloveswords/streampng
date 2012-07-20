var crc32 = require('buffer-crc32');
var util = require('util');
var zlib = require('zlib');
var BitReader = require('bitreader');
var BitWriter = require('bitwriter');

function Base() {  }

Base.inherits = function inherits(cls) { util.inherits(cls, Base) };

Base.make = function make(type, opts) {
  var constructor = function constructor(data, header) {
    if (!(this instanceof constructor))
      return new constructor(data, header);
    this.type = type;
    if (!Buffer.isBuffer(data))
      return this.create(data);
    else this._rawData = data;
    if (this.initialize)
      this.initialize(data, header);
  };
  Base.inherits(constructor);
  return constructor;
};

/**
 * Get a parser for a buffer.
 *
 * @param {Buffer} data defaults to the buffer passed into constructor
 * @return {BitReader}
 */

Base.prototype.getParser = function (data) {
  return new BitReader(data || this._rawData);
};

/**
 * Calculate the CRC for the chunk.
 *
 * @return {Buffer}
 */

Base.prototype.getComputedCrc = function getComputedCrc() {
  return crc(this.type, this._rawData);
};
function crc(type, data) {
  var buf = Buffer.concat([Buffer(type), data]);
  return crc32(buf);
}

/**
 * Generic implementation for chunk creation.
 *
 * If a chunk needs to do anything more complicated than a 1-1 mapping of
 * data from an object, it should override this.
 *
 * @param {Object} obj data to store in the chunk
 */

Base.prototype.create = function create(obj) {
  Object.keys(obj).forEach(function (k) {
    if (!this[k]) this[k] = obj[k];
  }.bind(this));
};

/**
 * Generic implementation for inflating data
 *
 * @param {Function} callback
 * @return {Error, Buffer} <params for callback>
 */

Base.prototype.inflate = function inflate(callback) {
  var thinName, fatName;
  if (this.compressedProfile)
    thinName = 'compressedProfile', fatName = 'profile';
  else
    thinName = 'compressedText', fatName = 'text';

  if (!callback) callback = function () {};
  if (this[fatName]) return callback(null, this[fatName]);
  zlib.inflate(this[thinName], function (err, buf) {
    if (err) return callback(err);
    this[fatName] = buf.toString().replace(/\u0000$/, '');
    callback(null, this[fatName]);
  });

  return this;
};

/**
 * Stub for outputting buffer for a complete chunk. Chunk classes should
 * implement a `writeData` method to complete this.
 *
 * @param {Function} callback
 * @return {Buffer} completed buffer
 */

Base.prototype.out = function out(callback) {
  if (!this.writeData) throw new Error('Needs implementation');
  var output = this.writeData(this._outputPrepare());
 if (output) callback(output.done());
};


/**
 * Stub for getting length of the data part of a chunk. Should not include
 * length, type or crc portions.
 */

Base.prototype.length = function length() {
  throw new Error('Need implementation');
};

/**
 * Sets a value. Unsets `this._buffer` if the new value is different than
 * the current value.
 *
 * @param {String} key
 * @param {Mixed} value
 */

Base.prototype.set = function set(key, value) {
  if (typeof value === 'undefined') return this;
  if (value === this[key]) return this;
  this[key] = value;
  this._buffer = null;
  return this;
};

/**
 * Gets a value.
 *
 * @param {String} key
 */

Base.prototype.get = function get(key) {
  return this[key];
};

/**
 * Make an output object.
 *
 * @param {Integer} len defaults to return value of `this.length()`
 * @return {Output} object ready for writing data to
 */

Base.prototype._outputPrepare = function outputPrepare(len) {
  if (typeof len === 'undefined')
    len = this.length ? this.length() : null;

  if (typeof len !== 'number' || isNaN(len))
    throw new TypeError('Argument must be a number, got ' + len)

  var buf = new Output(len, this.type);
  this._rawData = buf.data;
  return buf;
};

function Output(length, type) {
  this.length = BitWriter(4);
  this.type = Buffer(type);
  this.data = BitWriter(length);

  this.length.write32(length);
  this.data.attach(this);
};

Output.prototype.done = function done(callback) {
  this.result = Buffer.concat([
    this.length,
    this.type,
    this.data,
    crc(this.type, this.data)
  ]);
  if (callback) return callback(this.result);
  return this.result;
};
module.exports = Base;