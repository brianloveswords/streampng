var Base = require('./base.js');
/**
 * If the sRGB chunk is present, the image samples conform to the sRGB
 * colour space [IEC 61966-2-1] and should be displayed using the
 * specified rendering intent defined by the International Color
 * Consortium [ICC-1] and [ICC-1A].
 *
 * [Reference](http://www.w3.org/TR/PNG/#11sRGB)
 */

function StandardRGBColourSpace(data) {
  var p = this.getParser(data);
  this.type = 'sRGB';
  this.possibleIntents = [
    'Perceptual',
    'Relative colorimetric',
    'Saturation',
    'Absolute colorimetric'
  ];
  this.renderingIntent = p.eatUInt(1);
}
Base.inherits(StandardRGBColourSpace);

module.exports = StandardRGBColourSpace;