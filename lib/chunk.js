var BitReader = require('bitreader');
var Base = require('./chunks/base.js');

function Chunk(parser, header) {
  // duck type check to make sure we've been given a parser instance.
  // assume it's a buffer otherwise.
  if (typeof parser.eat !== 'function')
    parser = BitReader(parser)

  // we need at least 12 bytes to do anything useful.
  this.parser = parser;
  this.header = header;
  if (parser.remaining() >= 12)
    return this._process();
}

Chunk.prototype._process = function () {
  var parser = this.parser;
  var rawLength = parser.eat(4);
  var length = rawLength.readUInt32BE(0);
  var rawType = parser.eat(4);
  var type = rawType.toString()

  if (!type.match(/\w+/))
    throw new Error('invalid chunk type, got: ' + this.type);

  var rawData = length ? parser.eat(length) : Buffer(0);
  var rawCrc = parser.eat(4);

  var Constructor = Chunk[type] || Chunk.Unknown;
  var chunk = new Constructor(rawData, this.header, type);

  // #TODO: check data against CRC.
  chunk.crc = rawCrc;
  chunk._rawData = rawData;
  chunk._buffer = Buffer.concat([rawLength, rawType, rawData, rawCrc]);
  return chunk;
};

Chunk.Unknown = function (data, header, type) {
  this.type = type;
  this.data = data;
  this.header = header;
}
Chunk.IHDR = Chunk.ImageHeader = require('./chunks/image-header.js');
Chunk.PLTE = Chunk.Palette = require('./chunks/palette.js');
Chunk.IDAT = Chunk.ImageData = require('./chunks/image-data.js');
Chunk.IEND = Chunk.ImageTrailer = require('./chunks/image-trailer.js');
Chunk.tEXt = Chunk.TextualData = require('./chunks/textual-data.js');
Chunk.zTXt = Chunk.CompressedText = require('./chunks/compressed-text.js');
Chunk.iTXt = Chunk.InternationalText = require('./chunks/international-text.js');
Chunk.cHRM = Chunk.Chromaticities = require('./chunks/chromaticities.js');
Chunk.gAMA = Chunk.Gamma = require('./chunks/gamma.js');
Chunk.tRNS = Chunk.Transparency = require('./chunks/transparency.js');
Chunk.iCCP = Chunk.ICCProfile = require('./chunks/icc-profile.js');
Chunk.bKGD = Chunk.BackgroundColour = require('./chunks/background-colour.js');
Chunk.pHYs = Chunk.PhysicalDimensions = require('./chunks/physical-dimensions.js');
Chunk.sRGB = Chunk.StandardRGBColourSpace = require('./chunks/srgb.js');
Chunk.sBIT = Chunk.SignificantBits = require('./chunks/significant-bits.js');
Chunk.hIST = Chunk.Histogram = require('./chunks/histogram.js');
Chunk.sPLT = Chunk.SuggestedPalette = require('./chunks/suggested-palette.js');
Chunk.tIME = Chunk.LastModified = require('./chunks/last-modified.js');
Chunk.oFFs = Chunk.Offset = require('./chunks/offset.js');
Chunk.pCAL = Chunk.PixelCalibration = require('./chunks/pixel-calibration.js');
Chunk.sCAL = Chunk.Scale = require('./chunks/scale.js');
Chunk.gIFg = Chunk.GifControl = require('./chunks/gif-control.js');
Chunk.gIFx = Chunk.GifApplication = require('./chunks/gif-application.js');
Chunk.sTER = Chunk.Stereogram = require('./chunks/stereogram.js');

module.exports = Chunk;