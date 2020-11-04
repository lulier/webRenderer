var fs = require('fs');
const TGA = require('./tga');
const GL = require("./gl");
const math = require("./vector");
const { Vector } = require('./vector');
var OBJ = require('webgl-obj-loader');
const { TGAColor } = require('./tga');
const vector = require('./vector');

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
    let screenCoordinates = [];
    let worldCoordinates = [];
    for (let i = 0; i < mesh.vertices.length; i+=3) {
        let temp = new Vector(0,0);
        temp.x = Math.round((mesh.vertices[i] + 1) * image.width / 2);
        temp.y = Math.round((mesh.vertices[i + 1] + 1) * image.height / 2);
        screenCoordinates.push(temp);
        worldCoordinates.push(new Vector(mesh.vertices[i],mesh.vertices[i+1],mesh.vertices[i+2]));
    }

    for (let i = 0; i < mesh.indices.length; i+=3) {
        const point1 = screenCoordinates[mesh.indices[i]];
        const point2 = screenCoordinates[mesh.indices[i+1]];
        const point3 = screenCoordinates[mesh.indices[i+2]];

        const ab = Vector.sub(worldCoordinates[mesh.indices[i+1]],worldCoordinates[mesh.indices[i]]);
        const ac = Vector.sub(worldCoordinates[mesh.indices[i+2]],worldCoordinates[mesh.indices[i]]);
        let normal = Vector.cross(ab,ac).normalize();

        let lightDir = new Vector(0,0,1);
        let intensity = normal.x*lightDir.x+normal.y*lightDir.y+normal.z*lightDir.z;
        // console.log(intensity);
        if(intensity > 0){
            GL.drawTriangle([point1,point2,point3],
                image,new TGAColor(255*intensity,255*intensity,255*intensity,255));
        }
        
    }

    image.output();
}

function readTGAFile(){
    const tgaFile = new TGA.TGALoader(fs.readFileSync("./out.tga"))
    console.log(tgaFile.pixels[0],tgaFile.pixels[1],tgaFile.pixels[2],tgaFile.pixels[3]);
}
