var fs = require('fs');
const TGA = require('./tga');
const GL = require("./gl");
const whiteColor = new TGA.TGAColor(255,255,255,255);
const redColor = new TGA.TGAColor(255,0,0,255);
const blackColor = new TGA.TGAColor(0,0,0,255);

// const tgaFile = new TGA.TGALoader(fs.readFileSync("./out.tga"))
// console.log(tgaFile.pixels[0],tgaFile.pixels[1],tgaFile.pixels[2],tgaFile.pixels[3]);

const image = new TGA.TGAImage(100,100);

// for (let i = 0; i < 30; i++) {
//     image.set(30,i,redColor);
// }    
// image.set(0,0,whiteColor);
GL.drawLine(0,10,50,20,image,redColor);
GL.drawLine(10,0,20,50,image,whiteColor);
image.output();

