var Base = require('./base.js');
var BitWriter = require('../bitwriter.js');

// http://www.w3.org/TR/PNG/#11IHDR
var ImageHeader = Base.make('IHDR');

ImageHeader.COLOUR_TYPES = {
  '0': 'greyscale',
  '2': 'truecolour',
  '3': 'indexed-colour',
  '4': 'greyscale with alpha',
  '6': 'truecolour with alpha'
};
ImageHeader.BIT_DEPTHS = {
  'greyscale': [1, 2, 4, 8, 16],
  'truecolour': [8, 16],
  'indexed-colour': [1, 2, 4, 8],
  'greyscale with alpha': [8, 16],
  'truecolour with alpha': [8, 16]
};
ImageHeader.INTERLACE_METHODS = {
  '0': 'none',
  '1': 'adam-7'
};
ImageHeader.COMPRESSION_METHODS = {
  '0': 'zlib deflate/inflate'
};
ImageHeader.FILTER_METHODS = {
  '0': 'standard'
};

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
ImageHeader.prototype.buffer = function buffer() {
  var length = 13;
  var typebuf = this._rawType = BitWriter(this.type);
  var databuf = this._rawData = BitWriter(length);
  var lenbuf = BitWriter(4);
  lenbuf.write32(length);
  databuf.write32(this.width);
  databuf.write32(this.height);
  databuf.write8(this.bitDepth);
  databuf.write8(this.colourType);
  databuf.write8(this.compressionMethod);
  databuf.write8(this.filterMethod);
  databuf.write8(this.interlaceMethod);
  var crcbuf = this.crcCalculated();
  return Buffer.concat([ lenbuf, typebuf, databuf, crcbuf ]);
};

module.exports = ImageHeader;