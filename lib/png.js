var stream = file.createReadStream('somefile.txt');
var png = new PNG({ checksum: false });
stream.pipe(png);
png.on('end', fn);
png.on('error', err);


png.on('IHDR', function () {}); // 1, must appear first
png.on('tIME', function () {}); // ?
png.on('zTXt', function () {}); // *
png.on('tEXt', function () {}); // *
png.on('iTXt', function () {}); // *
png.on('pHYs', function () {}); // ?
png.on('sPLT', function () {}); // *
png.on('iCCP', function () {}); // ? (mutually exclusive with sRGB)
png.on('sRGB', function () {}); // ? (mutually exclusive with iCCP)
png.on('sBIT', function () {}); // ?
png.on('gAMA', function () {}); // ?
png.on('cHRM', function () {}); // ?

png.on('PLTE', function () {}); // 1 or 0
png.on('tRNS', function () {}); // ?, if PLTE exists, must appear after
png.on('hIST', function () {}); // ?, can only appear with PLTE
png.on('bKGD', function () {}); // ?, if PLTE exists, must appear after

png.on('IDAT', function () {}); // +, must appear after all the shit above.
png.on('IEND', function () {}); // 1, must be the last thing.

PNG.prototype.write = function write(data) {};
util.inherits(PNG, Stream);