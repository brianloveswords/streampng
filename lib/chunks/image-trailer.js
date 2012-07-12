var Base = require('./base.js');
/**
 * Marks the end of the datastream. Always an empty chunk.
 */

var ImageTrailer = Base.make('IEND');
ImageTrailer.prototype.out = function out(callback) {
  return callback(Buffer([
    0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82
  ]));
};

module.exports = ImageTrailer;