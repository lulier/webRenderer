
var fs = require('fs');
const { isDeepStrictEqual } = require('util');
class TGAColor{
    constructor(r=255,g=255,b=255,a=255){
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class TGAImage {

    constructor(width, height, dontFlipY = false, pixels = null){
        this.width = width;
        this.height = height;
        this.isFlipY = !dontFlipY;
        const bufferLength = pixels ? 18 + pixels.length: 18 + width * height * 4;
        var buffer = Buffer.alloc(bufferLength);
        // write header
        buffer.writeInt8(0, 0);
        buffer.writeInt8(0, 1);
        buffer.writeInt8(2, 2);
        buffer.writeInt16LE(0, 3);
        buffer.writeInt16LE(0, 5);
        buffer.writeInt8(0, 7);
        buffer.writeInt16LE(0, 8);
        buffer.writeInt16LE(0, 10);
        buffer.writeInt16LE(width, 12);
        buffer.writeInt16LE(height, 14);
        buffer.writeInt8(32, 16);
        buffer.writeInt8(dontFlipY?32:0, 17);

        var offset = 18;
        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                var idx = ((dontFlipY ? i : height - i - 1) * width + j) * 4;
                if(pixels){
                    buffer.writeUInt8(pixels[idx + 2], offset++);    // b
                    buffer.writeUInt8(pixels[idx + 1], offset++);    // g
                    buffer.writeUInt8(pixels[idx], offset++);        // r
                    buffer.writeUInt8(pixels[idx + 3], offset++);    // a
                } else{
                    buffer.writeUInt8(0, offset++);    // b
                    buffer.writeUInt8(0, offset++);    // g
                    buffer.writeUInt8(0, offset++);        // r
                    buffer.writeUInt8(255, offset++);    // a
                }
            }
        }

        this.buffer = buffer;
    }

    set(i,j,color){
        let index = 18;
        
        index = index + (i+j*this.width)*4;

        if(index + 3 < this.buffer.length){
            this.buffer.writeUInt8(color.b, index);       
            this.buffer.writeUInt8(color.g, index + 1);  
            this.buffer.writeUInt8(color.r, index + 2);   
            this.buffer.writeUInt8(color.a, index + 3);
        }
    }
    output(){
        fs.writeFileSync('./out.tga', this.buffer);
    }
}

class TGALoader{
    constructor(buffer) {
        if(buffer){
            this.buffer = buffer;
            this.parse();
        }
    }
    
    static getHeader(buffer) {
        var header = {};
        header.idlength = buffer.readInt8(0);
        header.colourMapType = buffer.readInt8(1);
        header.dataTypeCode = buffer.readInt8(2);
        header.colourMapOrigin = buffer.readInt16LE(3);
        header.colourMapLength = buffer.readInt16LE(5);
        header.colourMapDepth = buffer.readInt8(7);
        header.xOrigin = buffer.readInt16LE(8);
        header.yOrigin = buffer.readInt16LE(10);
        header.width = buffer.readInt16LE(12);
        header.height = buffer.readInt16LE(14);
        header.bitsPerPixel = buffer.readInt8(16);
        header.imageDescriptor = buffer.readInt8(17);
        return header;
    }

    parse() {
        
        this.header = this.readHeader();
        if (!this.check()) {
            return;
        }
        this.readPixels();
    }
    readHeader() {
        
        var header = TGALoader.getHeader(this.buffer);
        this.width = header.width;
        this.height = header.height;
        this.bytesPerPixel = header.bytesPerPixel = header.bitsPerPixel / 8;
        this.isFlipY = !(header.imageDescriptor & 32);
        
        return header;
    }
    check() {
        var header = this.header;
        /* What can we handle */
        if (header.dataTypeCode != 2 && header.dataTypeCode != 10) {
            console.error('Can only handle image type 2 and 10');
            return false;
        }
        if (header.bitsPerPixel != 16 && 
            header.bitsPerPixel != 24 && header.bitsPerPixel != 32) {
            console.error('Can only handle pixel depths of 16, 24, and 32');
            return false;
        }
        if (header.colourMapType != 0 && header.colourMapType != 1) {
            console.error('Can only handle colour map types of 0 and 1');
            return false;
        }
        return true;
    }
    
    readPixels() {
        var header = this.header;
        var bytesPerPixel = header.bytesPerPixel;
        var pixelCount = header.width * header.height;
        var data = new Uint8Array(this.buffer);
        this.pixels = new Uint8Array(pixelCount * 4);
        var offset = 18;

        for (var i = 0; i < pixelCount; i++) {
            if (header.dataTypeCode === 2) {
                this.addPixel(data, offset, i);
            } else if (header.dataTypeCode === 10) {
                var flag = data[offset++];
                var count = flag & 0x7f;
                var isRLEChunk = flag & 0x80;
                this.addPixel(data, offset, i);
                for (var j = 0; j < count; j++) {
                    if (!isRLEChunk) {
                        offset += this.bytesPerPixel;
                    }
                    this.addPixel(data, offset, ++i);
                }
            }
            offset += this.bytesPerPixel;
        }
    }

    addPixel(arr, offset, idx) {
        if (!this.isFlipY) {
            var y = this.height - 1 - Math.floor(idx / this.width);
            idx = y * this.width + idx % this.width;
        }
        idx *= 4;
        var count = this.bytesPerPixel;
        var r = 255;
        var g = 255;
        var b = 255;
        var a = 255;
        if (count === 3 || count === 4) {
            r = arr[offset + 2];
            g = arr[offset + 1];
            b = arr[offset];
            a = count === 4 ? arr[offset + 3] : 255;
        } else if (count === 2) {
            r = (arr[offset + 1] & 0x7c) << 1;
            g = ((arr[offset + 1] & 0x03) << 6) | ((arr[offset] & 0xe0) >> 2);
            b = (arr[offset] & 0x1f) << 3;
            a = (arr[offset + 1] & 0x80);
        } else {
            console.error('cant transform to Pixel');
        }

        this.pixels[idx] = r;
        this.pixels[idx + 1] = g;
        this.pixels[idx + 2] = b;
        this.pixels[idx + 3] = a;
    }
}

module.exports = {TGAImage,TGAColor,TGALoader};