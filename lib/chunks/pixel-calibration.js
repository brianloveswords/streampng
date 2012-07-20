var Base = require('./base.js');

/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

var PixelCalibration = Base.make('pCAL');
PixelCalibration.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
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
};
PixelCalibration.prototype.length = function length() {
  var len = 0;
  len += (this.name.length + 1);
  len += 4; // original zero
  len += 4; // original maximum
  len += 1; // equationType
  len += 1; // number of parameters
  len = this.parameters.reduce(function (accum, p) {
    return accum + (p.unit.length + 1) + (p.parameter.toString().length + 1)
  }, len);
  len -= 1; // no trailing null
  return len;
};
PixelCalibration.prototype.writeData = function writeData(output) {

  output.write(this.name);
  output.write32(this.originalZero);
  output.write32(this.originalMaximum);
  output.write8(this.equationType);
  output.write8(this.parameters.length);
  this.parameters.forEach(function (p) {
    output.write(p.unit);
    output.write(p.parameter.toString());
  });
  return output;
};
PixelCalibration.EQUATION_TYPES = [
  'linear',
  'base-e exponential',
  'arbitrary-base exponential',
  'hyperbolic',
];
PixelCalibration.LINEAR = 0;
PixelCalibration.BASE_E_EXPONENTAL = 1;
PixelCalibration.ARIBTRARY_BASE_EXPONENTIAL = 2;
PixelCalibration.HYPERBOLIC = 3;

module.exports = PixelCalibration;