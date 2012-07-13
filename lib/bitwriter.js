var util = require('util');
var bufproto = Buffer.prototype;

function BitWriter(length, endianness) {
  if (typeof length === 'string') return new Buffer(length);
  if (!(this instanceof BitWriter))
    return new BitWriter(length, endianness);
  this.initialize.apply(this, arguments)
}
util.inherits(BitWriter, Buffer);

BitWriter.prototype.initialize = function initialize(length, endianness) {
  var buf = this._buffer = Buffer(length);
  buf.fill(0);

  // this give us compatibility with a bunch of buffer methods
  this.parent = this._buffer.parent;
  this.length = this._buffer.length;
  this.offset = this._buffer.offset;
  this.pool = this._buffer.pool;

  this._pos = 0;
  this._endianness = endianness || 'BE';
  this._generateMethodTable();
  this._makeArrayLike();
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

  type.method.call(this._buffer, data, this._pos);
  this._pos += type.length;
  return this;
};

BitWriter.prototype.writeString = function writeString(string, opts) {
  var nullByte = opts ? opts.null : true;
  var buf = Buffer(string);
  if ((nullByte !== false && this.length - this._pos - buf.length) > 0)
    buf = Buffer.concat([buf, Buffer([0x00])]);
  return this.write(buf);
};

BitWriter.prototype.writeRaw = function writeRaw(array) {
  for (var n = 0; n < array.length; n++) {
    this._buffer.writeUInt8(array[n], this._pos++);
  }
  return this;
};
/** convenience */
BitWriter.prototype.write8 = function (v) {
  return this.write(v, {size: 8});
};
/** convenience */
BitWriter.prototype.write16 = function (v) {
  return this.write(v, {size: 16});
};
/** convenience */
BitWriter.prototype.write32 = function (v) {
  return this.write(v, {size: 32});
};

/**
 * Attach bound write methods to another object.
 *
 * @param {Object} obj
 */

BitWriter.prototype.attach = function (obj) {
  var proto = BitWriter.prototype;
  Object.keys(proto).filter(function (m) {
    return m.match(/^write/);
  }).forEach(function (method) {
    var bound = this[method].bind(this);
    obj[method] = bound;
  }.bind(this));
  return obj;
};

BitWriter.prototype._generateMethodTable = function generateMethodTable() {
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

BitWriter.prototype._makeArrayLike = function makeArrayLike() {
  var len = this.length;
  for (var n = 0; n < this.length; n++) {
    (function (n) {
      Object.defineProperty(this, n, {
        get: function () { return this.get(n) },
        enumerable: true,
        configurable: true
      });
    }).bind(this)(n);
  }
};

BitWriter.prototype.inspect = Object.prototype.inspect;


function between(v, min, max) { return v >= min && v <= max }
function gentestInt(min, max) { return function (v) { return between(v, min, max) } }
module.exports = BitWriter;
