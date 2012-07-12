var Base = require('./base.js');
var zlib = require('zlib');

/**
 * If the iCCP chunk is present, the image samples conform to the colour
 * space represented by the embedded ICC profile as defined by the
 * International Color Consortium [ICC]. The colour space of the ICC
 * profile shall be an RGB colour space for colour images (PNG colour
 * types 2, 3, and 6), or a greyscale colour space for greyscale images
 * (PNG colour types 0 and 4).
 *
 * [Reference](http://www.w3.org/TR/PNG/#11iCCP)
 */

function ICCProfile(data) {
  var p = this.getParser(data);
  this.type = 'iCCP';
  this.profileName = p.eatString();
  this.compressionMethod = p.eatUInt(1);
  this.compressedProfile = p.eatRest();
}
Base.inherits(ICCProfile);

module.exports = ICCProfile;