var Base = require('./base.js');

// http://www.w3.org/TR/PNG/#11IHDR
var ImageHeader = Base.make('IHDR');

ImageHeader.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.critical = true;
  this.width = p.eatUInt(4);
  this.height = p.eatUInt(4);

  // #TODO: range check on these values
  this.bitDepth = p.eatUInt(1);
  this.colourType = p.eatUInt(1);
  this.compressionMethod = p.eatUInt(1)
  this.filterMethod = p.eatUInt(1);
  this.interlaceMethod = p.eatUInt(1);
};
ImageHeader.prototype.writeData = function writeData(output) {
  var colour = this.colourType;
  if (typeof colour === 'undefined')
    colour = this.colorType;

  output
    .write32(this.width)
    .write32(this.height)
    .write8(this.bitDepth)
    .write8(colour)
    .write8(this.compressionMethod || 0)
    .write8(this.filterMethod || 0)
    .write8(this.interlaceMethod || 0);
  return output;
};
ImageHeader.prototype.length = function length() { return 13 };

ImageHeader.COLOUR_TYPES = {
  '0': 'greyscale',
  '2': 'truecolour',
  '3': 'indexed-colour',
  '4': 'greyscale with alpha',
  '6': 'truecolour with alpha'
};
ImageHeader.GREYSCALE = 0;
ImageHeader.TRUECOLOUR = 2;
ImageHeader.INDEXED_COLOUR = 3;
ImageHeader.GREYSCALE_ALPHA = 4;
ImageHeader.TRUECOLOUR_ALPHA = 6;

ImageHeader.BIT_DEPTHS = {
  'greyscale': [1, 2, 4, 8, 16],
  'truecolour': [8, 16],
  'indexed-colour': [1, 2, 4, 8],
  'greyscale with alpha': [8, 16],
  'truecolour with alpha': [8, 16]
};

ImageHeader.INTERLACE_METHODS = {
  '0': 'none',
  '1': 'adam7'
};
ImageHeader.NONE = 0;
ImageHeader.ADAM7 = 1;

ImageHeader.COMPRESSION_METHODS = {
  '0': 'zlib deflate/inflate'
};
ImageHeader.ZLIB = 0;

ImageHeader.FILTER_METHODS = {
  '0': 'standard'
};
ImageHeader.STANDARD = 0;


module.exports = ImageHeader;