var fs = require('fs');
const TGA = require('./tga');
const GL = require("./gl");
const math = require("./vector");
const { Vector } = require('./vector');

const whiteColor = new TGA.TGAColor(255,255,255,255);
const redColor = new TGA.TGAColor(255,0,0,255);
const blackColor = new TGA.TGAColor(0,0,0,255);



const image = new TGA.TGAImage(100,100);

let points = [];
points.push(new Vector(10,20));
points.push(new Vector(50,20));
points.push(new Vector(40,60));
GL.drawTriangle(points,image,redColor);
// GL.drawLine(new math.Vector(0,10),new math.Vector(50,20),image,redColor);
// GL.drawLine(new math.Vector(10,0),new math.Vector(20,50),image,whiteColor);

image.output();


function readTGAFile(){
    // const tgaFile = new TGA.TGALoader(fs.readFileSync("./out.tga"))
    // console.log(tgaFile.pixels[0],tgaFile.pixels[1],tgaFile.pixels[2],tgaFile.pixels[3]);
}
