var _crc32 = require('crc').crc32;
var Buffer = require('buffer').Buffer;

exports.crc32 = function(string) {
  if (Buffer.isBuffer(string))
    string = buffer.toString();
  var sum = _crc32(string);
  var buf = Buffer(4);
  buf.writeInt32BE(sum, 0);
  return buf;
};
