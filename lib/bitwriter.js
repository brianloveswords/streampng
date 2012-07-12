var util = require('util');

var bufproto = Buffer.prototype;

function BitWriter(length, endianness) {
  if (!(this instanceof BitWriter))
    return new BitWriter(length, endianness);
  this.initialize.apply(this, arguments)
}
BitWriter.prototype.initialize = function initialize(length, endianness) {
  var buf = this._buffer = Buffer(length);
  buf.fill(0);
  this._offset = 0;
  this._endianness = endianness || 'BE';
  this._generate();
};

BitWriter.prototype.out = function out() {
  return this._buffer;
};

BitWriter.prototype.write = function write(data, opts) {
  var type;

  if (typeof data === 'string')
    return this.writeString.apply(this, arguments);

  if (util.isArray(data) || Buffer.isBuffer(data))
    return this.writeRaw.apply(this, arguments)

  if (opts) {
    var methodlist = this._methods.bySize;
    type = methodlist[data > 0 ? 'unsigned' : 'signed'][opts.size];
  }

  else {
    type = this._methods.filter(function (m) {
      if (m.test(data)) return m;
    })[0];
  }

  if (!type) {
    var err = new Error('could not dispatch, received value: ' + data + ', opts: ' + opts);
    throw err;
  }

  type.method.call(this._buffer, data, this._offset);
  this._offset += type.length;
};

BitWriter.prototype.writeString = function writeString(string, opts) {
  var nullbyte = '\u0000';
  if (opts && opts.null === false)
    nullbyte = '';
  this._buffer.write(string + nullbyte, this._offset);
  this._offset += string.length + nullbyte.length;
};

BitWriter.prototype.writeRaw = function writeRaw(array) {
  for (var n = 0; n < array.length; n++) {
    this._buffer.writeUInt8(array[n], this._offset++);
  }
};
/** convenience */
BitWriter.prototype.write32 = function () {

}

BitWriter.prototype._generate = function generate() {
  var e = this._endianness;
  this._methods = [
    { method: bufproto['writeUInt8'],
      length: 1,
      test: gentestInt(0, 0xff),
    }, {
      method: bufproto['writeUInt16' + e],
      length: 2,
      test: gentestInt(0, 0xffff),
    }, {
      method: bufproto['writeUInt32' + e],
      length: 4,
      test: gentestInt(0, 0xffffffff),
    }, {
      method: bufproto['writeInt8'],
      length: 1,
      test: gentestInt(-0x80, 0x7f)
    }, {
      str: 'writeInt16' + e,
      method: bufproto['writeInt16' + e],
      length: 2,
      test: gentestInt(-0x8000, 0x7fff)
    }, {
      method: bufproto['writeInt32' + e],
      length: 4,
      test: gentestInt(-0x80000000, 0x7fffffff)
    }
  ];
  this._methods.bySize = {
    unsigned: {
      '8': this._methods[0],
      '16': this._methods[1],
      '32': this._methods[2],
    },
    signed: {
      '8': this._methods[3],
      '16': this._methods[4],
      '32': this._methods[5],
    }
  }
};


function between(v, min, max) { return v >= min && v <= max }
function gentestInt(min, max) { return function (v) { return between(v, min, max) } }
module.exports = BitWriter;
