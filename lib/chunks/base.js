var crc32 = require('buffer-crc32');
var util = require('util');
var zlib = require('zlib');
var BitReader = require('../bitreader.js');
var BitWriter = require('../bitwriter.js');

function Base() {  }

/**
 * Get the calculated the CRC
 */

Base.prototype.crcCalculated = function crcCalculated() {
  if (this._crcCalculated) return this._crcCalculated;
  var calculated = crc32(Buffer.concat([this._rawType, this._rawData]));
  this._crcCalculated = calculated;
  return calculated;
};

Base.prototype.create = function create(obj) {
  Object.keys(obj).forEach(function (k) {
    if (!this[k]) this[k] = obj[k];
  }.bind(this));
};

Base.prototype.getParser = function (data) {
  return new BitReader(data ||  this._rawData);
};

Base.prototype.inflate = function inflateText(callback) {
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
};

Base.inherits = function inherits(cls) {
  util.inherits(cls, Base);
};

Base.make = function make(type) {
  var constructor = function constructor(data, header) {
    this.type = type;
    if (!Buffer.isBuffer(data))
      return this.create(data);
    if (this.initialize)
      this.initialize(data, header);
  };
  Base.inherits(constructor);
  return constructor;
};

Base.prototype._outputPrepare = function outputPrepare(len) {
  if (typeof len === 'undefined')
    len = this.length ? this.length() : null;

  if (typeof len !== 'number')
    throw new TypeError('Argument must be a number, got ' + len)

  var buf = {
    type: BitWriter(this.type) ,
    data: BitWriter(len),
    length: BitWriter(4)
  };
  buf['length'].write32(len);
  this._rawType = buf['type'];
  this._rawData = buf['data'];
  this._rawLength = buf['length'];
  buf.done = this._output.bind(this, buf);
  return buf;
};

Base.prototype._output = function output(buf) {
  buf['crc'] = this.crcCalculated();
  return Buffer.concat([
    buf['length'],
    buf['type'],
    buf['data'],
    buf['crc']
  ]);
};

module.exports = Base;