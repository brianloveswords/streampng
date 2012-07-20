var Base = require('./base.js');

/**
 * (Reference)[http://www.w3.org/TR/PNG/#11sPLT]
 */

var SuggestedPalette = Base.make('sPLT');
SuggestedPalette.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  var colourSize, chunkSize;

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
};
SuggestedPalette.prototype.sizes = function (depth) {
  var colour = ((this.sampleDepth || depth) === 16) ? 2 : 1;
  var chunk = colour === 2 ? 10 : 6;
  return { colour: colour, chunk: chunk };
};
SuggestedPalette.prototype.length = function length() {
  var sizes = this.sizes();
  return (
    (Buffer(this.paletteName).length + 1)
      + 1 // sample depth
      + this.palette.length * sizes.chunk
  );
};
SuggestedPalette.prototype.writeData = function writeData(output) {
  var writeColour = output['write' + this.sampleDepth];
  output
    .write(this.paletteName.trim())
    .write(sampleDepth);

  this.palette.forEach(function (entry) {
    writeColour(entry.red);
    writeColour(entry.green);
    writeColour(entry.blue);
    writeColour(entry.alpha);
    output.write16(entry.frequency);
  });
  return output;
};

module.exports = SuggestedPalette;
