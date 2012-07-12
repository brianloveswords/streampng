var Base = require('./base.js');

/**
 * (Reference)[http://www.w3.org/TR/PNG/#11sPLT]
 */

function SuggestedPalette(data) {
  var p = this.getParser(data);
  var colourSize, chunkSize;

  this.type = 'sPLT';
  this.paletteName = p.eatString();
  this.sampleDepth = p.eatUInt(1);
  this.palette = [];

  colourSize = (this.sampleDepth === 16) ? 2 : 1;
  chunkSize = colourSize === 2 ? 10 : 6

  // #TODO: make sure remaining is divisible by the chunkSize
  this.palette = p.eatRest({ chunkSize: chunkSize }).map(function (entry) {
    var pp = this.getParser(entry);
    return {
      red: pp.eatUInt(colourSize),
      green: pp.eatUInt(colourSize),
      blue: pp.eatUInt(colourSize),
      alpha: pp.eatUInt(colourSize),
      frequency: pp.eatUInt(2)
    }
  }.bind(this));
}
Base.inherits(SuggestedPalette);

module.exports = SuggestedPalette;
