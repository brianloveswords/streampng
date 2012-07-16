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

var ICCProfile = Base.make('iCCP');
ICCProfile.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.profileName = p.eatString();
  this.compressionMethod = p.eatUInt(1);
  this.compressedProfile = p.eatRest();
};
ICCProfile.prototype.writeData = function writeData(output) {
  output
    .write(this.profileName)
    .write(this.compressionMethod)
    .write(this.compressedProfile)
  return output;
};
ICCProfile.prototype.length = function length() {
  return (
    (Buffer(this.profileName).length + 1)
      + 1 // compression method
      + this.compressedProfile.length
  );
};
module.exports = ICCProfile;