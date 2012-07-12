/**
  A generic parser, implementing generic parser things like eating
  bytes, rewinding, peaking, etc.
*/

function BitReader(data) {
  this._buffer = new Buffer(0);
  if (data)
    this.write(data);
  this._offset = 0;
}

/**
 * Append a new buffer. If given a string, will perform conversion to buffer.
 *
 * @param {Buffer|String} data buffer (or string) to append
 * @return {Buffer} reference to new buffer.
 */
BitReader.prototype.write = function (data) {
  var newbuf = Buffer.isBuffer(data) ? data : Buffer(data.toString());
  var oldbuf = this._buffer;
  var length = newbuf.length + oldbuf.length;
  return (this._buffer = Buffer.concat([oldbuf, newbuf], length));
};

/**
 * Create new view of the internal buffer starting from the stored offset
 * and ending at offset + `amount`.
 *
 * @param {Integer} amount how many bytes to consume [default: 1]
 * @return {Buffer} with `amount` bytes or `null`.
 */

BitReader.prototype.eat = function eat(amount, opts) {
  opts = opts || {}

  var offset, start, end, value, buf, buflen;
  amount = amount || 1;
  offset = this._offset;
  buf = this._buffer;
  buflen = buf.length;

  if (offset >= buflen)
    return null;

  start = offset;
  end = offset + amount;

  // we don't want to deal with oob errors so if we're trying to consume
  // past the boundary of the buffer, consume the rest.
  if (end >= buflen) end = buflen;

  value = buf.slice(start, end);
  this._offset = end;

  if (value.length === 0)
    return null;

  if (opts.integer) {
    var prefix = 'readInt'
    if (opts.signed === false)
      prefix = 'readUInt';
    var methodName = prefix + (amount * 8);
    if (amount > 1) methodName += 'BE';
    return value[methodName](0);
  }
  return value;
};

/** convience methods */
BitReader.prototype.eatInt = function (amount) {
  return this.eat(amount, { integer: true, signed: true });
};
BitReader.prototype.eatUInt = function (amount) {
  return this.eat(amount, { integer: true, signed: false });
};
BitReader.prototype.eatBool = function () {
  return !!this.eatUInt(1);
};

/**
 * Like `BitReader#eat` but return a string (or `null`).
 *
 * @see BitReader#eat
 */

BitReader.prototype.eats = function eats(amount) {
  var value = this.eat(amount);
  return value ? value.toString() : null;
};

/**
 * Rewind the offset by `amount` bytes, or rewind it to the beginning.
 *
 * @param {Integer} amount number of bytes to rewind [default: 0, all the way]
 * @return {Integer} the new offset
 */

BitReader.prototype.rewind = function rewind(amount) {
  if (!amount) return (this._offset = 0);
  return (this._offset -= amount);
};


/**
 * Get the current offset.
 *
 * @return {Integer} the offset
 */

BitReader.prototype.position = function position() {
  return this._offset;
};

/**
 * Get the value of the byte at the current offset.
 *
 * @return {Integer} byte at current offset
 */

BitReader.prototype.peak = function peak(amount) {
  var value =  this.eat(amount);
  this.rewind(amount);
  return value;
};

/**
 * Like `BitReader#peak`, but converts to ascii string.
 *
 * @see BitReader#peak
 */

BitReader.prototype.peaks = function peaks(amount) {
  var value = this.peak(amount);
  return value ? value.toString() : null;
};

/**
 * Consume bytes until a separator or EOF is found.
 *
 * @param {Integer} sep byte to look for [default: 0]
 * @return {String}
 */

BitReader.prototype.eatString = function eatString(sep) {
  // default the separator to null byte
  var buf, start, end, value;
  if (!sep) sep = 0;
  buf = this._buffer

  // we want to eat until we find a null byte or until the end
  start = this._offset;
  while ((value = this.eat()) && value[0] !== 0);
  end = this._offset;

  if (start === end)
    return null;

  // if we aren't at the end of the buffer, slice a byte off the end so
  // we exclude the separator.
  if (end !== buf.length)
    end -= 1;

  return buf.slice(start, end).toString();
};

/**
 * Get all remaining bytes in buffer.
 *
 * @return {Buffer | null} remaining bytes in a buffer or null.
 */

BitReader.prototype.eatRemaining = function eatRemaining(opts) {
  opts = opts || {};
  var buf, start, value;
  buf = this._buffer;
  start = this._offset;
  if (!opts.chunkSize) {
    value = buf.slice(start, buf.length);
    this._offset = buf.length;
    if (value.length === 0)
      return null;
    return value;
  }

  var chunks = [];
  while ((value = this.eat(opts.chunkSize)))
    chunks.push(value);
  return chunks;
};
BitReader.prototype.eatRest = BitReader.prototype.eatRemaining;

/**
 * Get a reference to the internal buffer
 *
 * @return {Buffer}
 */

BitReader.prototype.getBuffer = function getBuffer() {
  return this._buffer;
};


/**
 * Get number of remaining bytes in buffer
 */
BitReader.prototype.remaining = function remaining() {
  return this.getBuffer().length - this.position();
};

module.exports = BitReader;