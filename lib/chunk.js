var zlib = require('zlib');
var crc32 = require('buffer-crc32');
var bufferEqual = require('buffer-equal');
var inherits = require('util').inherits;

var Parser = require('./parser.js');
var util = require('./util.js');
var Colour = util.Colour;
var Point = util.Point;

function Chunk(parser, header) {
  // duck type check to make sure we've been given a parser instance
  if (typeof parser.eat !== 'function')
    parser = new Parser(parser);

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
}

Chunk.prototype.crcCalculated = function () {
  if (this._crcCalculated) return this._crcCalculated;
  var calculated = crc32(Buffer.concat([this._rawType, this._rawData]));
  this._crcCalculated = calculated;
  return calculated;
}

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
inherits(ImageHeader, Chunk);
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
inherits(ImageData, Chunk);

/**
 * Marks the end of the datastream. Always an empty chunk.
 */

function ImageTrailer(data) {
  var p = new Parser(data);
  this.type = 'IEND';
  this.critical = true;
}
inherits(ImageTrailer, Chunk);

/**
 * Plaintext metadata
 */

function TextualData(data) {
  var p = new Parser(data);
  this.type = 'tEXt';
  this.keyword = p.eatString();
  this.text = p.eatRest().toString();
}
inherits(TextualData, Chunk);

/**
 * Compressed textual metadata.
 */

function CompressedText(data) {
  var p = new Parser(data);
  this.type = 'zTXt';
  this.keyword = p.eatString();
  this.compressionMethod = p.eatUInt(1);
  this.compressedText = p.eatRest();
}
inherits(CompressedText, Chunk);
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
  this.compressed = !!p.eatUInt(1);
  this.compressionMethod = p.eat(1);
  this.languageTag = p.eatString();
  this.translatedKeyword = p.eatString();
  this.compressedText = p.eatRest();

  if (!this.compressed)
    this.text = this.compressedText.toString().replace(/\u0000$/, '')
}
inherits(InternationalText, Chunk);
InternationalText.prototype.inflateText = CompressedText.prototype.inflateText;

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
inherits(Palette, Chunk);

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
}
inherits(Chromaticities, Chunk);

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
inherits(Gamma, Chunk);

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
    this.grey = p.eatUInt(2);

  else if (colour === 2) {
    this.red = p.eatUInt(2);
    this.green = p.eatUInt(2);
    this.blue = p.eatUInt(2);
  }

  else if (colour === 3) {
    var value;
    this.palette = []
    while ((value = p.eat(1)))
      this.palette.push(value.readUInt8(0));
  }
}
inherits(Transparency, Chunk);

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
  this.compressionMethod = p.eatUInt(1);
  this.compressedProfile = p.eatRest();
}
inherits(ICCProfile, Chunk);
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
    this.greyscale = p.eatUInt(2);

  else if (colour === 2 || colour === 6) {
    this.red = p.eatUInt(2);
    this.green = p.eatUInt(2);
    this.blue = p.eatUInt(2);
  }

  else // if (colour === 3)
    this.paletteIndex = p.eatUInt(1);
}
inherits(BackgroundColour, Chunk);

/**
 * The pHYs chunk specifies the intended pixel size or aspect ratio for
 * display of the image.
 *
 * [Reference](http://www.w3.org/TR/PNG/#11pHYs)
 */

function Dimensions(data) {
  var p = new Parser(data);
  this.type = 'pHYs';
  this.unitSpecifierValues = ['unknown', 'meter']
  this.pixelsPerUnit = new Point(p.eatUInt(4), p.eatUInt(4));
  this.unitSpecifier = p.eatUInt(1);
}
inherits(Dimensions, Chunk);

/**
 * If the sRGB chunk is present, the image samples conform to the sRGB
 * colour space [IEC 61966-2-1] and should be displayed using the
 * specified rendering intent defined by the International Color
 * Consortium [ICC-1] and [ICC-1A].
 *
 * [Reference](http://www.w3.org/TR/PNG/#11sRGB)
 */

function StandardRGBColourSpace(data) {
  var p = new Parser(data);
  this.type = 'sRGB';
  this.possibleIntents = [
    'Perceptual',
    'Relative colorimetric',
    'Saturation',
    'Absolute colorimetric'
  ];
  this.renderingIntent = p.eatUInt(1);
}
inherits(StandardRGBColourSpace, Chunk);

function SignificantBits(data, header) {
  var p = new Parser(data);
  this.type = 'sBIT';

  var colour = this.colourType = header.colourType;

  if (colour === 0)
    this.greyscale = p.eat(1).readUInt8(0);

  else if (colour === 2 || colour === 3) {
    this.red = p.eatUInt(1);
    this.green = p.eatUInt(1);
    this.blue = p.eatUInt(1);
  }

  else if (colour === 4) {
    this.greyscale = p.eatUInt(1);
    this.alpha = p.eatUInt(1);
  }

  else if (colour === 6) {
    this.red = p.eatUInt(1);
    this.green = p.eatUInt(1);
    this.blue = p.eatUInt(1);
    this.alpha = p.eatUInt(1);
  }
}
inherits(SignificantBits, Chunk);

function Histogram(data) {
  var p = new Parser(data);
  this.type = 'hIST';
  this.frequencies = p.eatRest({ chunkSize: 2 }).map(util.to16Bit);
}
inherits(Histogram, Chunk);

function SuggestedPalette(data) {
  var p = new Parser(data);
  var colourSize, chunkSize;

  this.type = 'sPLT';
  this.paletteName = p.eatString();
  this.sampleDepth = p.eatUInt(1);
  this.palette = [];

  colourSize = (this.sampleDepth === 16) ? 2 : 1;
  chunkSize = colourSize === 2 ? 10 : 6

  // #TODO: make sure remaining is divisible by the chunkSize
  this.palette = p.eatRest({ chunkSize: chunkSize }).map(function (entry) {
    var pp = new Parser(entry);
    return {
      red: pp.eatUInt(colourSize),
      green: pp.eatUInt(colourSize),
      blue: pp.eatUInt(colourSize),
      alpha: pp.eatUInt(colourSize),
      frequency: pp.eatUInt(2)
    }
  });
}
inherits(SuggestedPalette, Chunk);

/**
 * Date of last modification
 */

function LastModified(data) {
  var p = new Parser(data);
  this.type = 'tIME';
  this.year = p.eatUInt(2);
  this.month = p.eatUInt(1);
  this.day = p.eatUInt(1);
  this.hour = p.eatUInt(1);
  this.minute = p.eatUInt(1);
  this.second = p.eatUInt(1);

  this.date = new Date(this.year, this.month, this.day,
                       this.hour, this.minute, this.second);
}
inherits(LastModified, Chunk);

function Offset(data) {
  var p = new Parser(data);
  var validSpecifiers = [ 'pixels', 'microns' ];
  var x = p.eatInt(4);
  var y = p.eatInt(4);
  this.type = 'oFFs';
  this.position = new Point(x, y);
  this.specifier = p.eat(1);
}
inherits(Offset, Chunk);

function PixelCalibration(data) {
  var p = new Parser(data);
  var validEquationTypes = [
    'linear',
    'base-e exponential',
    'arbitrary-base exponential',
    'hyperbolic',
  ];
  this.type = 'pCAL';
  this.name = p.eatString();
  this.originalZero = p.eatInt(4);
  this.originalMaximum = p.eatInt(4);
  this.equationType = p.eatUInt(1);

  // we can use this to make sure we got the right amount of params
  var numberOfParameters = p.eatUInt(1);

  this.parameters = [];
  while (p.remaining()) {
    this.parameters.push({
      unit: p.eatString(),
      parameter: parseFloat(p.eatString()),
    })
  }
}
inherits(PixelCalibration, Chunk);

function Scale(data) {
  var p = new Parser(data);
  var validSpecifiers = ['meters', 'radians'];
  this.type = 'sCAL';
  this.unitSpecifier = p.eatUInt(1);
  this.width = parseFloat(p.eatString());
  this.height = parseFloat(p.eatString());
}
inherits(Scale, Chunk);

function _create(obj) {
  console.dir(this);
}

Chunk.IHDR = Chunk.ImageHeader = ImageHeader;
Chunk.PLTE = Chunk.Palette = Palette;
Chunk.IDAT = Chunk.ImageData = ImageData;
Chunk.IEND = Chunk.ImageTrailer = ImageTrailer;
Chunk.tEXt = Chunk.TextualData = TextualData;
Chunk.zTXt = Chunk.CompressedText = CompressedText;
Chunk.iTXt = Chunk.InternationalText = InternationalText;
Chunk.cHRM = Chunk.Chromaticities = Chromaticities;
Chunk.gAMA = Chunk.Gamma = Gamma;
Chunk.tRNS = Chunk.Transparency = Transparency;
Chunk.iCCP = Chunk.ICCProfile = ICCProfile;
Chunk.bKGD = Chunk.BackgroundColour = BackgroundColour;
Chunk.pHYs = Chunk.Dimensions = Dimensions;
Chunk.sRGB = Chunk.StandardRGBColourSpace = StandardRGBColourSpace;
Chunk.sBIT = Chunk.SignificantBits = SignificantBits;
Chunk.hIST = Chunk.Histogram = Histogram;
Chunk.sPLT = Chunk.SuggestedPalette = SuggestedPalette;
Chunk.tIME = Chunk.LastModified = LastModified;
Chunk.oFFs = Chunk.Offset = Offset;
Chunk.pCAL = Chunk.PixelCalibration = PixelCalibration;
Chunk.sCAL = Chunk.Scale = Scale;

module.exports = Chunk;