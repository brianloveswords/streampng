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
ImageHeader.prototype.out = function out(callback) {
  var buf = this._outputPrepare();
  buf['data']
    .write32(this.width)
    .write32(this.height)
    .write8(this.bitDepth)
    .write8(this.colourType)
    .write8(this.compressionMethod)
    .write8(this.filterMethod)
    .write8(this.interlaceMethod);
  return callback(this._output(buf));
};
ImageHeader.prototype.length = function length() { return 13 };
module.exports = ImageHeader;