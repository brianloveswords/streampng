var Base = require('./base.js');
/**
 * If the sRGB chunk is present, the image samples conform to the sRGB
 * colour space [IEC 61966-2-1] and should be displayed using the
 * specified rendering intent defined by the International Color
 * Consortium [ICC-1] and [ICC-1A].
 *
 * [Reference](http://www.w3.org/TR/PNG/#11sRGB)
 */

var StandardRGBColourSpace = Base.make('sRGB');
StandardRGBColourSpace.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.renderingIntent = p.eatUInt(1);
}
StandardRGBColourSpace.prototype.length = function () { return 1 }
StandardRGBColourSpace.prototype.writeData = function (output) {
  output.write(this.renderingIntent);
  return output;
};
StandardRGBColourSpace.RENDERING_INTENTS = [
  'perceptual',
  'relative colorimetric',
  'saturation',
  'absolute colorimetric'
];
StandardRGBColourSpace.PERCEPTUAL = 0;
StandardRGBColourSpace.RELATIVE_COLORIMETRIC = 1;
StandardRGBColourSpace.SATURATION = 2;
StandardRGBColourSpace.ABSOLUTE_COLORIMETRIC = 3;

module.exports = StandardRGBColourSpace;