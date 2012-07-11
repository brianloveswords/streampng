var zlib = require('zlib');
var Parser = require('./parser.js');
var util = require('./util.js');
var Colour = util.Colour;
var Point = util.Point;

function Chunk(parser) {
  // duck type check to make sure we've been given a parser instance
  if (typeof parser.eat !== 'function')
    parser = new Parser(parser);

  // we need at least 12 bytes to do anything useful.
  var p = this.parser = parser;
  if (p.remaining() >= 12)
    return this.process();
}

Chunk.prototype.process = function () {
  var p = this.parser;
  var length = p.eat(4).readUInt32BE(0);
  var type = p.eat(4).toString();

  if (!type.match(/\w+/))
    throw new Error('invalid chunk type, got: ' + this.type);

  var data = length ? p.eat(length) : Buffer(0);
  var crc = p.eat(4);

  // #TODO: make sure constructor exists
  var Constructor = Chunk[type];
  var chunk = new Constructor(data);

  chunk.length = length;
  // #TODO: check data against CRC.
  chunk.crc = crc;
  chunk._rawData = data;
  return chunk;
}

module.exports = Chunk;


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


/**
 * The compressed datastream is then the concatenation of the contents
 * of the data fields of all the IDAT chunks.
 */

function ImageData(data) {
  var p = new Parser(data);
  this.type = 'IDAT';
  this.critical = true;
  this.data = p.getBuffer();
}

/**
 * Marks the end of the datastream. Always an empty chunk.
 */

function ImageTrailer(data) {
  var p = new Parser(data);
  this.type = 'IEND';
  this.critical = true;
}

/**
 * Plaintext metadata
 */

function TextualData(data) {
  var p = new Parser(data);
  this.type = 'tEXt';
  this.keyword = p.eatString();
  this.text = p.eatRemaining().toString();;
}

/**
 * Compressed textual metadata.
 */

function CompressedText(data) {
  var p = new Parser(data);
  this.type = 'zTXt';
  this.keyword = p.eatString();
  this.compressionMethod = p.eat(1).readUInt8(0);
  this.compressedText = p.eatRemaining();
}
CompressedText.prototype.inflateText = function inflateText(callback) {
  if (this.text) return callback(null, this.text);
  zlib.inflate(this.compressedText, function (err, buf) {
    if (err) return callback(err);
    this.text = buf.toString().replace(/\u0000$/, '');
    callback(null, this.text);
  });
};

/**
 * Internationalized textual metadata
 */

function InternationalText(data) {
  var p = new Parser(data);
  this.type = 'iTXt';
  this.keyword = p.eatString();
  this.compressed = !!(p.eat(1).readUInt8(0));
  this.compressionMethod = p.eat(1);
  this.languageTag = p.eatString();
  this.translatedKeyword = p.eatString();
  this.compressedText = p.eatRemaining();

  if (!this.compressed)
    this.text = this.compressedText.toString().replace(/\u0000$/, '')
}
InternationalText.prototype.inflateText = CompressedText.prototype.inflateText;

/**
 * Date of last modification
 */

function LastModified(data) {
  var p = new Parser(data);
  this.type = 'tIME';
  this.year = p.eat(2);
  this.month = p.eat(1);
  this.day = p.eat(1);
  this.hour = p.eat(1);
  this.minute = p.eat(1);
  this.second = p.eat(1);
}

/**
 * Palette for indexed images.
 */
function Palette(data) {
  // #TODO: make sure data.length is divisible by 3
  var p = new Parser(data);

  this.critical = true;
  this.colours = []

  var rgb;
  while ((rgb = p.eat(3)))
    this.colours.push(new Colour(rgb[0], rgb[1], rgb[2]));
}

/**
  * Each value is encoded as a four-byte PNG unsigned integer,
  * representing the x or y value times 100000.
  *
  * EXAMPLE: A value of 0.3127 would be stored as the integer 31270
  *
  * An sRGB chunk or iCCP chunk, when present and recognized,
  * overrides the cHRM chunk.
  */

function Chromaticities(data) {
  // #TODO: error checking
  var p = new Parser(data);

  function chromaPoint() {
    var x = util.fourByteFraction(p.eat(4));
    var y = util.fourByteFraction(p.eat(4));
    return new Point(x, y);
  }

  this.type = 'cHRM';
  this.whitePoint = chromaPoint();
  this.red = chromaPoint();
  this.green = chromaPoint();
  this.blue = chromaPoint();
};

/**
 * The value is encoded as a four-byte PNG unsigned integer,
 * representing gamma times 100000.
 *
 * EXAMPLE A gamma of 1/2.2 would be stored as the integer 45455.
 *
 * An sRGB chunk or iCCP chunk, when present and recognized,
 * overrides the gAMA chunk.
 */

function Gamma(data) {
  // #TODO: error checking
  var p = new Parser(data);

  this.type = 'gAMA';
  this.imageGamma = util.fourByteFraction(p.eat(4));
};


Chunk.IHDR = Chunk.ImageHeader = ImageHeader;
Chunk.PLTE = Chunk.Palette = Palette;
Chunk.IDAT = Chunk.ImageData = ImageData;
Chunk.IEND = Chunk.ImageTrailer = ImageTrailer;
Chunk.tEXt = Chunk.TextualData = TextualData;
Chunk.zTXt = Chunk.CompressedText = CompressedText;
Chunk.iTXt = Chunk.InternationalText = InternationalText;
Chunk.tIME = Chunk.LastModified = LastModified;
Chunk.cHRM = Chunk.Chromaticities = Chromaticities;

  // tRNS: function Transparency(data, header) {
  //   this.type = 'tRNS';

  //   var colour = header.colourType;

  //   // depends on ImageHeader.colourType
  //   if (colour === 0)
  //     this.greySampleValue = eat(2);

  //   else if (colour === 2) {
  //     this.redSampleValue = eat(2);
  //     this.blueSampleValue = eat(2);
  //     this.greenSampleValue = eat(2);
  //   }

  //   else if (colour === 3) {
  //     var value;
  //     this.paletteAlphas = []
  //     while ((value = eat(1)))
  //       this.paletteAlphas.push(value);
  //   }
  // },



  // iCCP: function ICCProfile(data) {
  //   this.type = 'iCCP';
  //   this.profileName = eatUntilNullByte()
  //   this.compressionMethod = eat(1);
  //   this.compressedProfile = eatRest();
  // },


  // bKGD: function BackgroundColour(data) {
  //   this.type = 'bKGD';
  //   /* The bKGD chunk specifies a default background colour to present
  //   the image against. If there is any other preferred background,
  //   either user-specified or part of a larger page (as in a browser),
  //   the bKGD chunk should be ignored. */

  //   // when colour type 0 or 4
  //   this.greyscale = eat(2);

  //   // when colour type 2 or 6
  //   this.red = eat(2);
  //   this.green = eat(2);
  //   this.blue = eat(2);

  //   // when colour type 3
  //   this.paletteIndex = eat(1);
  // },



  // pHYs: function Dimensions(data) {
  //   this.type = 'pHYs';
  //   this.unitSpecifierValues = ['unknown', 'metre']
  //   this.pixelsPerUnitX = eat(4);
  //   this.pixelsPerUnitY = eat(4);
  //   this.unitSpecifier = eat(1);
  // },


  // sRGB: function StandardRGBColourSpace(data) {
  //   this.type = 'sRGB';
  //   this.possibleIntents = [
  //     'Perceptual',
  //     'Relative colorimetric',
  //     'Saturation',
  //     'Absolute colorimetric'
  //   ];
  //   this.renderingIntent = eat(1);
  // },


  // sBIT: function SignificantBits(data) {
  //   this.type = 'sBIT';

  //   // when colour type 0
  //   this.greyscaleBits = eat(1);

  //   // when colour type 2 or 3
  //   this.redBits = eat(1);
  //   this.greenBits = eat(1);
  //   this.blueBits = eat(1);

  //   // when colour type 4
  //   this.greyscaleBytes = eat(1);
  //   this.alphaBits = eat(1);

  //   // when colour type 6
  //   this.redBits = eat(1);
  //   this.greenBits = eat(1);
  //   this.blueBits = eat(1);
  //   this.alphaBits = eat(1);
  // },

  // hIST: function ImageHistogram(data) {
  //   this.type = 'hIST';
  //   this.frequenices = eatRestInChunks(2)
  // },

  // sPLT: function SuggestedPalette(data) {
  //   var colourLength;

  //   this.type = 'sPLT';
  //   this.paletteName = eatUntilNullByte();
  //   this.sampleDepth = eat(1);

  //   // there can be many of these
  //   colourLength = (this.sampleDepth === 16) ? 2 : 1;
  //   this.red = eat(colourLength);
  //   this.green = eat(colourLength);
  //   this.blue = eat(colourLength);
  //   this.alpha = eat(colourLength);
  //   this.frequency = eat(2);
  // },
