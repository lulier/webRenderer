var fs = require('fs');
const TGA = require('./tga');
const GL = require("./gl");
const math = require("./vector");
const { Vector } = require('./vector');
var OBJ = require('webgl-obj-loader');
const { TGAColor } = require('./tga');

const whiteColor = new TGA.TGAColor(255,255,255,255);
const redColor = new TGA.TGAColor(255,0,0,255);
const blackColor = new TGA.TGAColor(0,0,0,255);

(function(){
    loadObj();
})()



function drawTriangle(){
    const image = new TGA.TGAImage(100,100);
    let points = [];
    points.push(new Vector(10,0));
    points.push(new Vector(40,0));
    points.push(new Vector(40,60));
    GL.drawTriangle(points,image,redColor);
    image.output();
}



function loadObj(){
    const image = new TGA.TGAImage(1000,1000);
    const objFile = fs.readFileSync("./obj/african_head/african_head.obj",{ encoding: 'utf8' });
    var mesh = new OBJ.Mesh(objFile);
    let coordinates = [];
    for (let i = 0; i < mesh.vertices.length; i+=3) {
        let screenC = new Vector(0,0);
        screenC.x = Math.round((mesh.vertices[i] + 1) * image.width / 2);
        screenC.y = Math.round((mesh.vertices[i + 1] + 1) * image.height / 2);
        coordinates.push(screenC);
    }

    for (let i = 0; i < mesh.indices.length; i+=3) {
        GL.drawTriangle([coordinates[mesh.indices[i]],coordinates[mesh.indices[i+1]],coordinates[mesh.indices[i+2]]],
            image,new TGAColor(255*Math.random(),255*Math.random(),255*Math.random(),255));
    }
    image.output();
}

function readTGAFile(){
    const tgaFile = new TGA.TGALoader(fs.readFileSync("./out.tga"))
    console.log(tgaFile.pixels[0],tgaFile.pixels[1],tgaFile.pixels[2],tgaFile.pixels[3]);
}
