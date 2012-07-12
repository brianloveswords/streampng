var zlib = require('zlib');
var bufferEqual = require('buffer-equal');
var inherits = require('util').inherits;
var Base = require('./chunks/base.js');

var BitReader = require('./bitreader.js');
var util = require('./util.js');
var Colour = util.Colour;
var Point = util.Point;

function Chunk(parser, header) {
  // duck type check to make sure we've been given a parser instance
  if (typeof parser.eat !== 'function')
    parser = new BitReader(parser);

  // we need at least 12 bytes to do anything useful.
  var p = this.parser = parser;
  this.header = header;
  if (p.remaining() >= 12)
    return this._process();
}

Chunk.prototype._process = function () {
  var p = this.parser;
  var length = p.eatUInt(4);
  var rawType = p.eat(4);
  var type = rawType.toString()

  if (!type.match(/\w+/))
    throw new Error('invalid chunk type, got: ' + this.type);

  var data = length ? p.eat(length) : Buffer(0);
  var crc = p.eat(4);

  // #TODO: better error
  var Constructor = Chunk[type];

  if (!Constructor) {
    var err = new Error('Could not find constructor for chunk [type: `' + type + '`]');
    throw err;
  }
  var chunk = new Constructor(data, this.header);

  chunk.length = length;
  // #TODO: check data against CRC.
  chunk.crc = crc;
  chunk._rawData = data;
  chunk._rawType = rawType;
  return chunk;
};

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