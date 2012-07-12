var Base = require('./base.js');

/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

function PixelCalibration(data) {
  var p = this.getParser(data);
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
Base.inherits(PixelCalibration);
PixelCalibration.EQUATION_TYPES = [
  'linear',
  'base-e exponential',
  'arbitrary-base exponential',
  'hyperbolic',
];

module.exports = PixelCalibration;