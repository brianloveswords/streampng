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
  this.gamma = util.fourByteFraction(p.eat(4));
};

/**
 * The tRNS chunk specifies either alpha values that are associated with
 * palette entries (for indexed-colour images) or a single transparent
 * colour (for greyscale and truecolour images).
 *
 * [Reference](http://www.w3.org/TR/PNG/#11tRNS)
 */

function Transparency(data, header) {
  // #TODO: error checking
  var p = new Parser(data);
  this.type = 'tRNS';

  var colour = this.colourType = header.colourType;

  if (colour === 0)
    this.grey = p.eat(2).readUInt16BE(0);

  else if (colour === 2) {
    this.red = p.eat(2).readUInt16BE(0);
    this.green = p.eat(2).readUInt16BE(0);
    this.blue = p.eat(2).readUInt16BE(0);
  }

  else if (colour === 3) {
    var value;
    this.palette = []
    while ((value = p.eat(1)))
      this.palette.push(value.readUInt8(0));
  }
};

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

function ICCProfile(data) {
  var p = new Parser(data);
  this.type = 'iCCP';
  this.profileName = p.eatString();
  this.compressionMethod = p.eat(1).readUInt8(0);
  this.compressedProfile = p.eatRemaining();
}
ICCProfile.prototype.inflateProfile = function inflateProfile(callback) {
  if (this.profile) return callback(null, this.profile);
  zlib.inflate(this.compressedProfile, function (err, data) {
    if (err) return callback(err);
    this.profile = data;
    callback(null, data);
  });
};

/**
 * The bKGD chunk specifies a default background colour to present
 * the image against. If there is any other preferred background,
 * either user-specified or part of a larger page (as in a browser),
 * the bKGD chunk should be ignored.
 *
 * [Reference](http://www.w3.org/TR/PNG/#11bKGD)
 */

function BackgroundColour(data, header) {
  var p = new Parser(data);
  this.type = 'bKGD';

  var colour = this.colourType = header.colourType;

  if (colour === 0 || colour === 4)
    this.greyscale = p.eat(2).readUInt16BE(0);

  else if (colour === 2 || colour === 6) {
    this.red = p.eat(2).readUInt16BE(0);
    this.green = p.eat(2).readUInt16BE(0);
    this.blue = p.eat(2).readUInt16BE(0);
  }

  else // if (colour === 3)
    this.paletteIndex = p.eat(1).readUInt8(0);
}

/**
 * The pHYs chunk specifies the intended pixel size or aspect ratio for
 * display of the image.
 *
 * [Reference](http://www.w3.org/TR/PNG/#11pHYs)
 */

function Dimensions(data) {
  var p = new Parser(data);
  this.type = 'pHYs';
  this.unitSpecifierValues = ['unknown', 'metre']
  this.pixelsPerUnit = new Point(p.eat(4).readUInt32BE(0),
                                 p.eat(4).readUInt32BE(0));
  this.unitSpecifier = p.eat(1).readUInt8(0);
}


Chunk.IHDR = Chunk.ImageHeader = ImageHeader;
Chunk.PLTE = Chunk.Palette = Palette;
Chunk.IDAT = Chunk.ImageData = ImageData;
Chunk.IEND = Chunk.ImageTrailer = ImageTrailer;
Chunk.tEXt = Chunk.TextualData = TextualData;
Chunk.zTXt = Chunk.CompressedText = CompressedText;
Chunk.iTXt = Chunk.InternationalText = InternationalText;
Chunk.tIME = Chunk.LastModified = LastModified;
Chunk.cHRM = Chunk.Chromaticities = Chromaticities;
Chunk.gAMA = Chunk.Gamma = Gamma;
Chunk.tRNS = Chunk.Transparency = Transparency;
Chunk.iCCP = Chunk.ICCProfile = ICCProfile;
Chunk.bKGD = Chunk.BackgroundColour = BackgroundColour;
Chunk.pHYs = Chunk.Dimensions = Dimensions;

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
