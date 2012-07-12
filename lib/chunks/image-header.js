var Base = require('./base.js');
var inherits = require('util').inherits;

function ImageHeader(data) {
  // http://www.w3.org/TR/PNG/#11IHDR
  var p = new Parser(data);
  this.type = 'IHDR';
  this.critical = true;
  this.width = p.eat(4).readUInt32BE(0);
  this.height = p.eat(4).readUInt32BE(0);

  // see validDepths
  this.depth = p.eat(1).readUInt8(0);

  // #TODO: check bit depth after discovering colourType
  this.colourType = ImageHeader.COLOUR_TYPES[p.eat(1).readUInt8(0)];

  // should always be 0
  this.compressionMethod = p.eat(1).readUInt8(0);

  // should always be 0
  this.filterMethod = p.eat(1).readUInt8(0);

  // should be 1 or 0
  this.interlaceMethod = p.eat(1).readUInt8(0);
}
inherits(ImageHeader, Base);
ImageHeader.COLOUR_TYPES = {
  '0': 'greyscale',
  '2': 'truecolour',
  '3': 'indexed-colour',
  '4': 'greyscale with alpha',
  '6': 'truecolour with alpha'
};
ImageHeader.VALID_DEPTHS = {
  'greyscale': [1, 2, 4, 8, 16],
  'truecolour': [8, 16],
  'indexed-colour': [1, 2, 4, 8],
  'greyscale with alpha': [8, 16],
  'truecolour with alpha': [8, 16]
};

module.exports = ImageHeader;