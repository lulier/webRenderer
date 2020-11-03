var fs = require('fs');
const TGA = require('./tga');
const GL = require("./gl");
const math = require("./vector");
const { Vector } = require('./vector');
var OBJ = require('webgl-obj-loader');

const whiteColor = new TGA.TGAColor(255,255,255,255);
const redColor = new TGA.TGAColor(255,0,0,255);
const blackColor = new TGA.TGAColor(0,0,0,255);



const image = new TGA.TGAImage(100,100);

let points = [];
points.push(new Vector(0,20));
points.push(new Vector(0,30));
points.push(new Vector(0,60));
GL.drawTriangle(points,image,redColor);
// GL.drawLine(new math.Vector(0,10),new math.Vector(50,20),image,redColor);
// GL.drawLine(new math.Vector(10,0),new math.Vector(20,50),image,whiteColor);

// image.output();


const objFile = fs.readFileSync("./obj/african_head/african_head.obj",{ encoding: 'utf8' });
var mesh = new OBJ.Mesh(objFile);
console.log(Object.keys(mesh));
console.log(mesh.vertices[0]);

function readTGAFile(){
    // const tgaFile = new TGA.TGALoader(fs.readFileSync("./out.tga"))
    // console.log(tgaFile.pixels[0],tgaFile.pixels[1],tgaFile.pixels[2],tgaFile.pixels[3]);
}
