var Base = require('./base.js');
var inherits = require('util').inherits;

/**
 * Date of last modification
 */

function LastModified(data) {
  this.type = 'tIME';
  if (!Buffer.isBuffer(data))
    return this.create(data);

  var p = this.getParser(data);
  this.year = p.eatUInt(2);
  this.month = p.eatUInt(1);
  this.day = p.eatUInt(1);
  this.hour = p.eatUInt(1);
  this.minute = p.eatUInt(1);
  this.second = p.eatUInt(1);

  this.date = new Date(this.year, this.month - 1, this.day,
                       this.hour - 1, this.minute, this.second);
}
inherits(LastModified, Base);
LastModified.prototype.buffer = function buffer() {
  var length = 7;
  var databuf = this._rawData = Buffer(length);
  var pos = 0;

  databuf.writeUInt16BE(this.year, 0);
  databuf.writeUInt8(this.month, 2);
  databuf.writeUInt8(this.day, 3);
  databuf.writeUInt8(this.hour, 4);
  databuf.writeUInt8(this.minute, 5);
  databuf.writeUInt8(this.second, 6);

  var typebuf = this._rawType = Buffer(this.type);
  var crcbuf = this.crcCalculated();
  var lenbuf = Buffer(4);
  lenbuf.writeUInt32BE(length, 0);

  return Buffer.concat([ lenbuf, typebuf, databuf, crcbuf ]);
};
module.exports = LastModified;
