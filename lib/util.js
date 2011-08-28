// from https://github.com/alexgorbatchev/node-crc/blob/master/lib/crc.js 

exports.intToBytes = function(y){
  return [(y & 0xFF000000) >> 24,
          (y & 0xFF0000) >> 16,
          (y & 0xFF00) >>  8,
          (y & 0xFF) >>  0]
}

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
    for (n = 0; n < buf.length; n++) {
      c = crctable[(c ^ buf[n]) & 0xff] ^ (c >> 8);
    }
    return c;
  }
  function referenceCRC(buf) {
    return updateCRC(0xffffffff, buf) ^ 0xffffffff;
  }
  return referenceCRC;
})()

