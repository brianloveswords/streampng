# streampng [![Build Status](https://secure.travis-ci.org/brianloveswords/streampng.png?branch=master)](http://travis-ci.org/brianloveswords/streampng)

Reading, modifying and (experimentally) writing PNGs, chunk by chunk.

## Install

```bash
$ npm install streampng
```

## Tests

Requires [node-tap](/isaacs/node-tap).

```bash
$ npm test
```

# API

## StreamPng([*streamOrBuffer*])
**@returns** `instance`<br>
**@throws** `TypeError`<br>
**@see** `Stream#pipe`<br>
**@see** `StreamPng#write`<br>
***

Inherits from `Stream`. Optionally takes a `Stream` or `Buffer`
instance. If the argument is a `Stream`, it will pipe the stream to the new
instance. If it's a buffer, the buffer will be passed to `StreamPng#write`.

## Event: 'data'
`function (data) { }`

Emitted whenever `StreamPng#write` or `StreamPng#end` is called with
data. Allows for transparent re-piping.

## Event: 'end'
`function () { }`

Emitted when the end of the input stream is reached.

## Event: 'error'
`function (exception) { }`

Emitted when there is an error parsing the PNG.

## Event: 'signature'
`function () { }`

Emitted after the PNG signature has been verified.

## Event: 'chunk'
`function (chunk) { }`

Emitted when a full chunk has been parsed.

## Event: chunkType
`function (chunk) { }`

Emitted when a chunk of a certain type has been parsed. For example,

```js
// do something with each tEXt chunk
png.on('tEXt', function(chunk) { ... })
```

## Event: 'imagedata begin'
`function () { }`

Emitted when the first `IDAT` chunk is recieved.

## StreamPng#write([*buffer*])
**@returns** `instance`<br>
**@emits** `{'data', Buffer}`<br>

***
Writes data to the internal parser. Does nothing if no arguments are
recieved. Emits a `data` event with the buffer that was passed in to
allow for chaining pipes:

```js
var outstream = fs.createWriteStream('node-logo.png');
var png = new StreamPng();
var opts = url.parse('http://nodejs.org/images/logo.png');

http.request(opts, function(res) {
  res.pipe(png).pipe(outstream);
}).end();

png.on('chunk', function(chunk) {
  console.dir(chunk);
});
```
In general, this shouldn't be called directly. Use `Stream#pipe` or pass
a full buffer via the constructor.


## StreamPng#end([*buffer*])
**@returns** `instance`<br>
**@emits** `{'end'}`<br>
**@see** `StreamPng#write`<br>
***

Called when the input stream is done (or immediately if a `Buffer` was
passed to the constructor).

This probably shouldn't ever have to be called directly.


## StreamPng#inject(*chunk, [opts, [conditionFn]]*)
**@returns** `instance`<br>
***
### Options
- `test`: Either `'all'` or `'same'`. Whether the condition should be
  checked against all chunks or just chunks of the same type.<br>Defaults
  to `'same'`.

Add a chunk to the PNG, optionally with a condition for inclusion.

Chunks will be added after directly after the `IHDR`
chunk. `conditionFn`, if passed, will be called with every chunk of the
same type. You can force the condition against every chunk by passing
`test: 'all'` in the options.

Here is an example of conditionally adding a `tEXt` chunk with a License
if one doesn't already exist.

```js
// setup
var fs = require('fs'), StreamPng = require('./');

var instream = fs.createReadStream('example.png');
var outfile = fs.createWriteStream('example.license.png');
var png = StreamPng(instream);
var license = StreamPng.Chunk.tEXt({
  keyword: 'License',
  text: 'CC BY-SA 3.0'
});

// add a `License` text chunk if one doesn't already exist.
 png.inject(license, function(chunk) {
   if (chunk.get('keyword') === 'License')
      return false;
});

// write output to file
png.out().pipe(outfile);
```
**Important**: note the use of `StreamPng#out` before calling pipe –
calling `pipe()` directly on the instance will pipe the input
transparently, without modification.


## StreamPng#out([*callback*])
**@returns** `new Stream`<br>
***
Outputs the (potentially modified) PNG buffer. Can be used either
callback style or stream style:

Callback example:
```js
png.out(function (err, buf) {
  fs.writeFile('example.png', buf, function() {
    console.log('done');
   });
});
```
Stream example:
```js
var infile = fs.createWriteStream('example.png');
png.out().pipe(infile).once('close', function() {
  console.log('done');
});
```

# Common chunk methods

All chunk constructors take one argument, `fields`, which should be an
object defining the fields necessary for the chunk.

## Chunk#set(*key, value*)
**@returns** `instance`<br>
***
Set a chunk attribute. Use this rather than directly accessing
attributes to ensure that cached buffers are correctly invalidated.


## Chunk#get(*key*)
**@returns** `value`<br>
***
Gets a chunk attribute.


## Chunk#inflate([*callback*])
**@returns** `instance`<br>
***
**Callback**: `function (err, buffer) { }`

For chunks that have compressed fields (`iTXt`, `zTXt`, `iCCP`),
inflates the compressed data, sets the appropriate attribute on the
chunk (`text` for textual data, `profile` for ICC profile data) and
executes callback either either the zlib error or the inflated buffer.


## Chunk#length()
**@returns** `Integer`<br>
***
 Length of the data portion of the chunk. For the length of the entire
chunk including length, type and CRC segments, add `12` to the result.


## Chunk#getComputedCrc()
**@returns** `Buffer`<br>
***
 Calculate the CRC for the chunk.

# Specific chunk attributes
All incoming chunks will have `type` and `crc` fields.


## Chunk.IHDR, Chunk.ImageHeader
- `width`: Width of the image in pixels
- `height`: Height of the image in pixels
- `colourType`: The type of image. Must be one of the following values:
  - `IHDR.GREYSCALE`
  - `IHDR.TRUECOLOUR`
  - `IHDR.INDEXED_COLOUR`
  - `IHDR.GREYSCALE_ALPHA`
  - `IHDR.TRUECOLOUR_ALPHA`
- `bitDepth`: The following values are valid depending on colour type:
  - greyscale: `[1, 2, 4, 8 ,16]`
  - truecolour: `[8, 16]`
  - indexed: `[1, 2, 4, 8]`
  - greyscale with alpha: `[8, 16]`
  - truecolour with alpha: `[8, 16]`
- `interlaceMethod`: Whether the image is interlaced. The png
  specification recognizes the following values:
  - `IHDR.NONE`
  - `IHDR.ADAM7`: Adam7 style interlacing.


## Chunk.tIME, Chunk.LastModified
- `year`: Four digit year (e.g, 2046)
- `month`: Month, starting at 1 for January. (valid: 1-12)
- `day`: Day of the month, starting at 1. (valid: 1-31)
- `hour`: In 24 hour format (valid: 0-23)
- `minute`: Minutes (valid: 0-59)
- `second`: Seconds (valid: 0-60, to allow for leap second)


## Chunk.zTXt, Chunk.CompressedText
- `keyword`: According to the specification, should use Latin-1
  character set and be less than 79 characters (not  enforced by this
  implementation).
- `compressionMethod`: How the image is compressed. The only method
  currently defined in the png specification is `0`  for zlib deflate/inflate.
- `text`: Uncompressed  textual data.
- `compressedText`: Buffer of compressed text.


## Chunk.tEXt, Chunk.TextualData
- `keyword`: According to the specification, should use Latin-1
  character set and be less than 79 characters (not  enforced by this
  implementation).
- `text`: The textual data.


## Chunk.iTXt, Chunk.InternationalText
- `keyword`: According to the specification, should use Latin-1
  character set and be less than 79 characters (not  enforced by this
  implementation).
- `translatedKeyword`: Can be UTF-8. Optional.
- `languageTag`: Language of the `text` and `translatedKeyword` fields.
- `compressed`: `true` if the text field should be compressed before
  outputting, `false` otherwise.
- `text`: The textual data.
- `compressedText`: Buffer of compressed text.


## Chunk.pHYs, Chunk.PhysicalDimensions
- `pixelsPerUnit`: How many pixels per unit are there in each
  dimensions. Can be an array `[1, 10]` or an object `{x: 14, y: 27}`
- `unitSpecifier`: Valid values are:
  - `0` for unknown
  - `1` for meters


## Chunk.sPLT, Chunk.SuggestedPalette
- `paletteName`: The palette name is case-sensitive, and subject to the
  same restrictions as the keyword parameter for the tEXt chunk. Palette
  names shall contain only printable Latin-1 characters and spaces (only
  character codes 32-126 and 161-255 decimal are allowed).
- `sampleDepth`: The sPLT sample depth shall be 8 or 16.
- `palette`: An array of objects with the following fields:
  - `red`: Red component of sample. Max value of 255 or 65535.
  - `green`: Green component of sample. Max value of 255 or 65535.
  - `blue`: Blue component of sample. Max value of 255 or 65535.
  - `alpha`: Alpha component of sample. Max value of 255 or 65535.
  - `frequency`:  Frequency of sample appearance. Range 0 to 65535


## Chunk.iCCP, Chunk.ICCProfile
- `profileName`: The profile name is case-sensitive, and subject to the
  same restrictions as the keyword parameter for the tEXt chunk. Palette
  names shall contain only printable Latin-1 characters and spaces (only
  character codes 32-126 and 161-255 decimal are allowed).
- `profile`: Buffer of the profile data.
- `compressedProfile`: Compressed Buffer of the profile data.


## Chunk.sRGB, Chunk.StandardRGBColourSpace
- `renderingIntent`: Should be one of the following constants:
  - `sRGB.PERCEPTUAL`, for images preferring good adaptation to the
    output device gamut at the expense of colorimetric accuracy, such as
    photographs.
  - `sRGB.RELATIVE_COLORIMETRIC`, for images requiring colour appearance
    matching (relative to the output device white point), such as logos.
  - `sRGB.SATURATION`, for images preferring preservation of saturation
    at the expense of hue and lightness, such as charts and graphs.
  - `sRGB.ABSOLUTE_COLORIMETRIC`, for images requiring preservation of
    absolute colorimetry, such as previews of images destined for a
    different output device (proofs).


## Chunk.sBIT, Chunk.SignificantBits
All fields have a range of 0 to image sample depth, inclusive.

When type is greyscale:
- `greyscale`

When type is truecolour or indexed colour:
- `red`
- `green`
- `blue`

When type is greyscale with alpha
- `greyscale`
- `alpha`

When type is truecolour with alpha
- `red`
- `green`
- `blue`
- `alpha`


## Chunk.gAMA, Chunk.Gamma
- `gamma`: Float representing the image gamma.


## Chunk.cHRM, Chunk.Chromaticities
Optional. If present, can appear exactly once.

All fields can be arrays in the form of `[x, y]` or objects with
`{ x: value, y : value}`

- `whitePoint`
- `red`
- `green`
- `blue`


## Chunk.PLTE, Chunk.Palette
Can appear exactly once. Required for images of type 3, optional for
types 2 and 6. Must not appear for types 0 and 4.

-`colours`: Array of objects. Max length of 256, all values must be
 between 0-255
  - `red`
  - `green`
  - `blue`


## Chunk.tRNS, Chunk.Transparency
Specifies either alpha values that are associated with palette entries
(for indexed-colour images) or a single transparent colour (for
greyscale and truecolour images).

Type 0, value between 0 and (2<sup>bitdepth</sup>-1)
- `greyscale`: 0-65535

Type 2, all values between 0 and (2<sup>bitdepth</sup>-1)
- `red`
- `green`
- `blue`

Type 3, all values between 0 and 255
- `palette`: Array ordered by palette index.


## Chunk.hIST, Chunk.Histogram
Gives the approximate usage frequency of each colour in the palette. A
histogram chunk can appear only when a PLTE chunk appears.

- `frequencies`


## Chunk.bKGD, Chunk.BackgroundColour
Specifies a default background colour to present the image
against. Optional; if present, must appear no more than once.

greyscale types:
- `greyscale`: Between 0 and (2<sup>bitdepth</sup>-1)

truecolour types, all values between 0 and (2<sup>bitdepth</sup>-1)
- `red`
- `green`
- `blue`

index colour:
- `paletteIndex`: Index of the palette entry to be used as the
  background.


## Chunk.IDAT, Chunk.ImageData
Contains the actual image data which is the output stream of the
compression algorithm

- `data`: compressed image data.

## Chunk.IEND, Chunk.ImageTrailer
Marks the end of the PNG datastream. The chunk's data field is empty.


## Chunk.oFFs, Chunk.Offset
Gives the position on a printed page at which the image should be output
when printed alone. It can also be used to define the image's location
with respect to a larger screen or other application-specific coordinate
system.

- `position`: Position on the page, accessible by `[x, y]` or
`{x:  value, y: value}`. Value is a signed 32-bit integer.

- `unitSpecifier`: One of the following constants:
  - `oFFs.PIXELS`: unit is pixels
  - `oFFs.MICRONS`: unit is microns


## Chunk.pCAL, Chunk.PixelCalibration
When a PNG file is being used to store physical data other than color
values, such as a two-dimensional temperature field, the pCAL chunk can
be used to record the relationship (mapping) between stored pixel
samples, original samples, and actual physical values. The pCAL data
might be used to construct a reference color bar beside the image, or to
extract the original physical data values from the file. It is not
expected to affect the way the pixels are displayed. Another method
should be used if the encoder wants the decoder to modify the sample
values for display purposes.

- `name`: The calibration name is case-sensitive, and subject to the
  same restrictions as the keyword parameter for the tEXt chunk. Palette
  names shall contain only printable Latin-1 characters and spaces (only
  character codes 32-126 and 161-255 decimal are allowed).
- `originalZero`: 32-bit signed integer.
- `originalMaximum`: 32-bit signed integer.
- `equationType`: Defines the pixel mapping equation: One of the
  following constants:
  - `pCAL.LINEAR`
  - `pCAL.BASE_E_EXPONENTAL`
  - `pCAL.ARIBTRARY_BASE_EXPONENTIAL`
  - `pCAL.HYPERBOLIC`
- `parameters`: Array of `n` length where `n=2` for linear, `n=3` for
  either of the exponential types and `n=4` for hyperbolic
  equations. Contains objects with:
  - `unit`: Unit name
  - `parameter`: Value of the parameter


## Chunk.sCAL, Chunk.Scale
While the pHYs chunk is used to record the physical size of the image
itself as it was scanned or as it should be printed, certain images
(such as maps, photomicrographs, astronomical surveys, floor plans, and
others) may benefit from knowing the actual physical dimensions of the
image's subject for remote measurement and other purposes. The sCAL
chunk serves this need.

- `unitSpecifier`: The following constants are defined:
  - `sCAL.METERS`: Units are meters
  - `sCAL.RADIANS`: Units are radians
- `width`: Floating point representing the unit width per pixel.
- `height`: Floating point representing the unit height per pixel.


## Chunk.gIFg, Chunk.GifControl
The gIFg chunk is provided for backward compatibility with the GIF89a
Graphic Control Extension.

- `disposalMethod`: The following constants are defined
  - `gIFg.NONE`
  - `gIFg.BACKGROUND`
  - `gIFg.PREVIOUS`
- `userInput`: Whether or not user input is required to activate
  animate. Defaults to `false`.
- `delay`: How long between frames in hundredths of seconds.


## Chunk.gIFx, Chunk.GifApplication
The gIFx chunk is provided for backward compatibility with the GIF89a
Application Extension. The Application Extension contains
application-specific information.

- `appIdentifier`: Up to  eight printable ASCII characters used to
  identify the application
- `authCode`: Buffer, application specific. Up to three bytes.
- `appData`: Buffer, application specific.


## Chunk.sTER, Chunk.Stereogram
When present, the sTER chunk indicates that the datastream contains a
stereo pair of subimages within a single PNG image.

- `mode`: One of the following constants:
  - `sTER.CROSS_FUSE`: right-eye image appears at the left and the
    left-eye image appears at the right, suitable for cross-eyed free
    viewing.

  - `sTER.DIVERGING_FUSE`: left-eye image appears at the left and the
    right-eye image appears at the right, suitable for divergent
    (wall-eyed) free viewing.
