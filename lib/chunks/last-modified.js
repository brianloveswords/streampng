var Base = require('./base.js');
var BitWriter = require('../bitwriter.js');

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
Base.inherits(LastModified);
LastModified.prototype.buffer = function buffer() {
  var length = 7;
  var databuf = this._rawData = BitWriter(length);
  var typebuf = this._rawType = BitWriter(this.type);
  var lenbuf = BitWriter(4);
  databuf.write16(this.year);
  databuf.write8(this.month);
  databuf.write8(this.day);
  databuf.write8(this.hour);
  databuf.write8(this.minute);
  databuf.write8(this.second);
  lenbuf.write32(length);
  var crcbuf = this.crcCalculated();
  return Buffer.concat([ lenbuf, typebuf, databuf, crcbuf ]);
};
module.exports = LastModified;
