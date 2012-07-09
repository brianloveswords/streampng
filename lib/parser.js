function Parser(data) {
  this._buffer = Buffer.isBuffer(data) ? data : Buffer(data.toString());
  this._offset = 0;
}
Parser.prototype.eat = function eat(amount) {
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
  return value;
};

Parser.prototype.eats = function eats(amount) {
  var value = this.eat(amount);
  return value ? value.toString() : null;
};

Parser.prototype.rewind = function rewind(amount) {
  return this._offset -= amount;
};

Parser.prototype.position = function position() {
  return this._offset;
};

Parser.prototype.peak = function peak() {
  return this._buffer[this._offset];
};

Parser.prototype.peaks = function peaks() {
  var value = this.peak();
  return value ? String.fromCharCode(value) : null;
};

Parser.prototype.eatString = function eatString(sep) {
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

Parser.prototype.eatRemaining = function eatRemaining() {
  var buf, start, value;
  buf = this._buffer;
  start = this._offset;
  value = buf.slice(start, buf.length);
  this._offset = buf.length;
  if (value.length === 0)
    return null;
  return value;
};

module.exports = Parser;