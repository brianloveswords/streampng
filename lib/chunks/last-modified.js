var Base = require('./base.js');
var BitWriter = require('../bitwriter.js');

/**
 * Date of last modification
 */

var LastModified = Base.make('tIME');
LastModified.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.year = p.eatUInt(2);
  this.month = p.eatUInt(1);
  this.day = p.eatUInt(1);
  this.hour = p.eatUInt(1);
  this.minute = p.eatUInt(1);
  this.second = p.eatUInt(1);

  this.date = new Date(this.year, this.month - 1, this.day,
                       this.hour - 1, this.minute, this.second);
};
LastModified.prototype.out = function out(callback) {
  var length = 7;
  var buf = this._outputPrepare(length);
  buf['data']
    .write16(this.year)
    .write8(this.month)
    .write8(this.day)
    .write8(this.hour)
    .write8(this.minute)
    .write8(this.second);
  return callback(this._output(buf));
};

module.exports = LastModified;