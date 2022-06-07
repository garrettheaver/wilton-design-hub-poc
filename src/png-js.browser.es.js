import { inflate } from 'pako';

var range = function range(left, right, inclusive) {
  var range = [];
  var ascending = left < right;
  var end = !inclusive ? right : ascending ? right + 1 : right - 1;

  for (var i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }

  return range;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var IndexedPNG = function () {
  function IndexedPNG(data) {
    classCallCheck(this, IndexedPNG);

    this.data = data;
    this.pos = 8; // Skip the default header

    this.palette = [];
    this.imgData = [];
    this.transparency = {};
    this.text = {};

    this.process();
  }

  createClass(IndexedPNG, [{
    key: 'process',
    value: function process() {
      var _this = this;

      var i = void 0;
      while (true) {
        var end;
        var chunkSize = this.readUInt32();
        var section = function () {
          var result = [];
          for (i = 0; i < 4; i++) {
            result.push(String.fromCharCode(_this.data[_this.pos++]));
          }
          return result;
        }().join('');

        switch (section) {
          case 'IHDR':
            // we can grab  interesting values from here (like width, height, etc)
            this.width = this.readUInt32();
            this.height = this.readUInt32();
            this.bitsPerColor = this.data[this.pos++];
            this.colorType = this.data[this.pos++];
            this.compressionMethod = this.data[this.pos++];
            this.filterMethod = this.data[this.pos++];
            this.interlaceMethod = this.data[this.pos++];
            break;

          case 'PLTE':
            this.palette = this.read(chunkSize);
            break;

          case 'IDAT':
            for (i = 0, end = chunkSize; i < end; i++) {
              this.imgData.push(this.data[this.pos++]);
            }
            break;

          case 'tRNS':
            // This chunk can only occur once and it must occur after the
            // PLTE chunk and before the IDAT chunk.
            this.transparency = {};
            switch (this.colorType) {
              case 3:
                // Indexed color, RGB. Each byte in this chunk is an alpha for
                // the palette index in the PLTE ("palette") chunk up until the
                // last non-opaque entry. Set up an array, stretching over all
                // palette entries which will be 0 (opaque) or 1 (transparent).
                this.transparency.indexed = this.read(chunkSize);
                var short = 255 - this.transparency.indexed.length;
                //var short = this.transparency.indexed.length-1;
                if (short > 0) {
                  var asc, end1;
                  for (i = 0, end1 = short, asc = 0 <= end1; asc ? i < end1 : i > end1; asc ? i++ : i--) {
                    this.transparency.indexed.push(0);
                  }
                }
                break;
              case 0:
                // Greyscale. Corresponding to entries in the PLTE chunk.
                // Grey is two bytes, range 0 .. (2 ^ bit-depth) - 1
                this.transparency.grayscale = this.read(chunkSize)[0];
                break;
              case 2:
                // True color with proper alpha channel.
                this.transparency.rgb = this.read(chunkSize);
                break;
            }
            break;

          case 'tEXt':
            var text = this.read(chunkSize);
            var index = text.indexOf(0);
            var key = String.fromCharCode.apply(String, toConsumableArray(Array.from(text.slice(0, index) || [])));
            this.text[key] = String.fromCharCode.apply(String, toConsumableArray(Array.from(text.slice(index + 1) || [])));
            break;

          case 'IEND':
            // we've got everything we need!
            this.colorsPerPixel = function () {
              switch (_this.colorType) {
                case 0:
                case 3:
                case 4:
                  return 1;
                case 2:
                case 6:
                  return 3;
              }
            }();

            this.hasAlphaChannel = [4, 6].includes(this.colorType);

            var trueColoursPerPixel = this.colorsPerPixel + (this.hasAlphaChannel ? 1 : 0);

            this.pixelBitlength = this.bitsPerColor * trueColoursPerPixel;

            this.colorSpace = function () {
              switch (_this.colorsPerPixel) {
                case 1:
                  return 'DeviceGray';
                case 3:
                  return 'DeviceRGB';
              }
            }();

            this.imgData = new Uint8Array(this.imgData);
            return;

          default:
            // unknown (or unimportant) section, skip it
            this.pos += chunkSize;
        }

        this.pos += 4; // Skip the CRC

        if (this.pos > this.data.length) {
          throw new Error("Incomplete or corrupt IndexedPNG file");
        }
      }
    }
  }, {
    key: 'read',
    value: function read(bytes) {
      var _this2 = this;

      return range(0, bytes, false).map(function (i) {
        return _this2.data[_this2.pos++];
      });
    }
  }, {
    key: 'readUInt32',
    value: function readUInt32() {
      var b1 = this.data[this.pos++] << 24;
      var b2 = this.data[this.pos++] << 16;
      var b3 = this.data[this.pos++] << 8;
      var b4 = this.data[this.pos++];
      return b1 | b2 | b3 | b4;
    }
  }, {
    key: 'readUInt16',
    value: function readUInt16() {
      var b1 = this.data[this.pos++] << 8;
      var b2 = this.data[this.pos++];
      return b1 | b2;
    }
  }, {
    key: 'decodePixels',
    value: async function decodePixels() {
      var data = void 0;
      try {
        data = inflate(this.imgData);
      } catch (err) {
        throw err;
      }
      var pixelBytes = this.pixelBitlength / 8;
      var scanlineLength = pixelBytes * this.width;

      var pixels = new Uint8Array(scanlineLength * this.height);
      var _data = data,
          length = _data.length;

      var row = 0;
      var pos = 0;
      var c = 0;

      while (pos < length) {
        var byte, col, i, left, upper;
        var end;
        var end1;
        var end2;
        var end3;
        var end4;
        switch (data[pos++]) {
          case 0:
            // None
            for (i = 0, end = scanlineLength; i < end; i++) {
              pixels[c++] = data[pos++];
            }
            break;

          case 1:
            // Sub
            for (i = 0, end1 = scanlineLength; i < end1; i++) {
              byte = data[pos++];
              left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
              pixels[c++] = (byte + left) % 256;
            }
            break;

          case 2:
            // Up
            for (i = 0, end2 = scanlineLength; i < end2; i++) {
              byte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
              pixels[c++] = (upper + byte) % 256;
            }
            break;

          case 3:
            // Average
            for (i = 0, end3 = scanlineLength; i < end3; i++) {
              byte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
              upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
              pixels[c++] = (byte + Math.floor((left + upper) / 2)) % 256;
            }
            break;

          case 4:
            // Paeth
            for (i = 0, end4 = scanlineLength; i < end4; i++) {
              var paeth, upperLeft;
              byte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              left = i < pixelBytes ? 0 : pixels[c - pixelBytes];

              if (row === 0) {
                upper = upperLeft = 0;
              } else {
                upper = pixels[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
                upperLeft = col && pixels[(row - 1) * scanlineLength + (col - 1) * pixelBytes + i % pixelBytes];
              }

              var p = left + upper - upperLeft;
              var pa = Math.abs(p - left);
              var pb = Math.abs(p - upper);
              var pc = Math.abs(p - upperLeft);

              if (pa <= pb && pa <= pc) {
                paeth = left;
              } else if (pb <= pc) {
                paeth = upper;
              } else {
                paeth = upperLeft;
              }

              pixels[c++] = (byte + paeth) % 256;
            }
            break;

          default:
            throw new Error('Invalid filter algorithm: ' + data[pos - 1]);
        }

        row++;
      }

      return pixels;
    }
  }, {
    key: 'decodePalette',
    value: function decodePalette() {
      var palette = this.palette;

      var transparency = this.transparency.indexed || [];
      var ret = new Uint8Array(palette.length / 3 * 4);
      var pos = 0;
      var length = palette.length;

      var c = 0;

      for (var i = 0, end = palette.length; i < end; i += 3) {
        var left;
        ret[pos++] = palette[i];
        ret[pos++] = palette[i + 1];
        ret[pos++] = palette[i + 2];
        ret[pos++] = (left = transparency[c++]) != null ? left : 255;
      }

      return ret;
    }
  }, {
    key: 'toPNGData',
    value: async function toPNGData(options) {
      var palette = options.palette || this.decodedPalette;

      var length = this.decodedPixels.length;
      var bytes = new Uint8ClampedArray(length * 4);
      var pixels = this.decodedPixels;

      var j = 0;
      for (var i = 0; i < length; i++) {
        var paletteIdx = pixels[i] * 4;
        bytes[j++] = palette[paletteIdx]; // R
        bytes[j++] = palette[paletteIdx + 1]; // G
        bytes[j++] = palette[paletteIdx + 2]; // B
        bytes[j++] = palette[paletteIdx + 3]; // A
      }

      return { pixels: bytes, width: this.width };
    }
  }, {
    key: 'toImageData',
    value: async function toImageData(options) {
      var data = await this.toPNGData(options);
      return new ImageData(data.pixels, data.width);
    }
  }, {
    key: 'decode',
    value: async function decode() {
      this.decodedPalette = this.decodePalette();
      this.decodedPixels = await this.decodePixels();
    }
  }]);
  return IndexedPNG;
}();

export default IndexedPNG;
