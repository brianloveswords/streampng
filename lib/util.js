// from https://github.com/alexgorbatchev/node-crc/blob/master/lib/crc.js 
exports.hex8 = function(val) {
  var n = (val & 0xFF), str = n.toString(16).toUpperCase();
  while(str.length < 2) str = "0" + str;
  return str;
}
exports.hex16 = function (val) { return hex8(val >> 8) + hex8(val);}
exports.hex32 = function (val) { return hex16(val >> 16) + hex16(val);}

// straight from the spec page: http://www.w3.org/TR/PNG/#5CRC-algorithm
exports.crc32 = (function(){
  var crctable = {}, computed = 0;
  function makeCRCtable() {
    var c, n, k;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) {
        if (c & 1) c = 0xedb88320 ^ (c >> 1);
        else c = c >> 1;
      }
      crctable[n] = c;
    }
    computed = 1;
  }
  function updateCRC(crc, buf) {
    var c = crc, n;
    if (!computed) makeCRCtable();
    for (n = 0; n < buf.len; n++) {
      c = crctable[(c ^ buf[n]) & 0xff] ^ (c >> 8);
    }
    return c;
  }
  function referenceCRC(buf) {
    return updateCRC(0xffffffff, buf, buf.len) ^ 0xffffffff;
  }
  return crc;
})()
