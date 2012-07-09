
function Chunk(data) {
  this.length = eat(4);
  this.type = eat(4);
  this.data = eat(this.length);
  this.crc = eat(4);
}

var ChunkType = {
  /* Critical chunks */
  // IHDR = [73, 72, 68, 82]
  IHDR : function ImageHeader(data) {
    // http://www.w3.org/TR/PNG/#11IHDR
    this.critical = true;

    this.validTypes = {
      // Greyscale
      '0': [1, 2, 4, 8, 16],
      // Truecolour
      '2': [8, 16],
      // Indexed-colour
      '3': [1, 2, 4, 8],
      // Greyscale with alpha
      '4': [8, 16],
      // Truecolour with alpha
      '6': [8, 16]
    };

    this.width = eat(4);
    this.height = eat(4);
    this.depth = eat(1);
    this.colourType = eat(1);
    this.compressionMethod = eat(1);
    this.filterMethod = eat(1);
    this.interlaceMethod = eat(1);
  },

  // PLTE = [80, 76, 84, 69]
  PLTE: function Palette(data) {
    // http://www.w3.org/TR/PNG/#11PLTE
    this.critical = true;
    this.entries = [];
    // eat three 1-byte chunks, R G B.
    // maximum of 256 entries
  },

  // IDAT = [73, 68, 65, 84]
  IDAT: function ImageData(data) {
    this.critical = true;
    // The compressed datastream is then the concatenation of the contents
    // of the data fields of all the IDAT chunks.
  },

  // IEND = [73, 69, 78, 68]
  IEND: function ImageTrailer(data) {
    this.critical = true;
    // marks the end of the datastream. empty chunk.
  },

  /* non-critical */
  // tRNS = [116, 82, 78, 83]
  tRNS: function Transparency(data, header) {
    var type = header.colourType;

    // depends on ImageHeader.colourType
    if (type === 0)
      this.greySampleValue = eat(2);

    else if (type === 2) {
      this.redSampleValue = eat(2);
      this.blueSampleValue = eat(2);
      this.greenSampleValue = eat(2);
    }

    else if (type === 3) {
      var value;
      this.paletteAlphas = []
      while ((value = eat(1)))
        this.paletteAlphas.push(value);
    }
  },

  /* Colour space info */
  //
  cHRM: function Chromaticities(data) {
    // Each value is encoded as a four-byte PNG unsigned integer,
    // representing the x or y value times 100000.

    // EXAMPLE: A value of 0.3127 would be stored as the integer 31270

    // An sRGB chunk or iCCP chunk, when present and recognized,
    // overrides the cHRM chunk.

    this.whitePointX = eat(4);
    this.whitePointY = eat(4);
    this.redX = eat(4);
    this.redY = eat(4);
    this.greenX = eat(4);
    this.greenY = eat(4);
    this.blueX = eat(4);
    this.blueY = eat(4);
  },
  gAMA: function Gamma(data) {
    // The value is encoded as a four-byte PNG unsigned integer,
    // representing gamma times 100000.

    // EXAMPLE A gamma of 1/2.2 would be stored as the integer 45455.

    // An sRGB chunk or iCCP chunk, when present and recognized,
    // overrides the gAMA chunk.
    this.imageGamma = eat(4);
  },
  iCCP: function ICCProfile(data) {
    this.profileName = eatUntilNullByte()
    this.compressionMethod = eat(1);
    this.compressedProfile = eatRest();
  },
  sBIT: function SignificantBits(data) {
    // when colour type 0
    this.greyscaleBits = eat(1);

    // when colour type 2 or 3
    this.redBits = eat(1);
    this.greenBits = eat(1);
    this.blueBits = eat(1);

    // when colour type 4
    this.greyscaleBytes = eat(1);
    this.alphaBits = eat(1);

    // when colour type 6
    this.redBits = eat(1);
    this.greenBits = eat(1);
    this.blueBits = eat(1);
    this.alphaBits = eat(1);
  },
  // sRGB = [115, 82, 71, 66]
  sRGB: function StandardRGBColourSpace(data) {
    this.possibleIntents = [
      'Perceptual',
      'Relative colorimetric',
      'Saturation',
      'Absolute colorimetric'
    ];
    this.renderingIntent = eat(1);
  },
  // tEXt = [116, 69, 88, 116]
  tEXt: function TextualData(data) {
    this.keyword = eatUntilNullByte();
    this.textString = eatRest();
  },
  // zTXt = [122, 84, 88, 116]
  zTXt: function CompressedText(data) {
    this.keyword = eatUntilNullByte();
    this.compressionMethod = eat(1);
    this.compressedTextStream = eatRest();
  },
  // iTXt = [105, 84, 88, 116]
  iTXt: function InternationalText(data) {
    this.keyword = eatUntilNullByte();
    this.compressionFlag = eat(1);
    this.compressionMethod = eat(1);
    this.languageTag = eatUntilNullByte();
    this.translatedKeyword = eatUntilNullByte();
    this.text = eatRest();
  },
  // bKGD = [98, 75, 71, 68]
  bKGD: function BackgroundColour(data) {
    /* The bKGD chunk specifies a default background colour to present
    the image against. If there is any other preferred background,
    either user-specified or part of a larger page (as in a browser),
    the bKGD chunk should be ignored. */

    // when colour type 0 or 4
    this.greyscale = eat(2);

    // when colour type 2 or 6
    this.red = eat(2);
    this.green = eat(2);
    this.blue = eat(2);

    // when colour type 3
    this.paletteIndex = eat(1);
  },
  // hIST = [104, 73, 83, 84]
  hIST: function ImageHistogram(data) {
    this.frequenices = eatRestInChunks(2)
  },
  // pHYs = [112, 72, 89, 115]
  pHYs: function Dimensions(data) {
    this.unitSpecifierValues = ['unknown', 'metre']
    this.pixelsPerUnitX = eat(4);
    this.pixelsPerUnitY = eat(4);
    this.unitSpecifier = eat(1);
  },

  //  sPLT = [115, 80, 76, 84]
  sPLT: function SuggestedPalette(data) {
    var colourLength;
    this.paletteName = eatUntilNullByte();
    this.sampleDepth = eat(1);

    // there can be many of these
    colourLength = (this.sampleDepth === 16) ? 2 : 1;
    this.red = eat(colourLength);
    this.green = eat(colourLength);
    this.blue = eat(colourLength);
    this.alpha = eat(colourLength);
    this.frequency = eat(2);
  },

  // tIME = [116, 73, 77, 69]
  tIME: function LastModified(data) {
    this.year = eat(2);
    this.month = eat(1);
    this.day = eat(1);
    this.hour = eat(1);
    this.minute = eat(1);
    this.second = eat(1);
  }
}
