var Base = require('./base.js');
var util = require('../util.js');
/**
 * The hIST chunk gives the approximate usage frequency of each colour
 * in the palette. A histogram chunk can appear only when a PLTE chunk
 * appears. If a viewer is unable to provide all the colours listed in
 * the palette, the histogram may help it decide how to choose a subset
 * of the colours for display.
 *
 * (Reference)[http://www.w3.org/TR/PNG/#11hIST]
 */

function Histogram(data) {
  var p = this.getParser(data);
  this.type = 'hIST';
  this.frequencies = p.eatRest({ chunkSize: 2 }).map(util.to16Bit);
}
Base.inherits(Histogram);

module.exports = Histogram;