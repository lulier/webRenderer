var fs = require('fs');
const TGA = require('./tga');
const GL = require("./gl");
const math = require("./vector");
const { Vector, Matrix } = require('./vector');
var OBJ = require('webgl-obj-loader');
const { TGAColor, TGALoader } = require('./tga');
const vector = require('./vector');
const tga = require('./tga');

const whiteColor = new TGA.TGAColor(255,255,255,255);
const redColor = new TGA.TGAColor(255,0,0,255);
const blackColor = new TGA.TGAColor(0,0,0,255);

(function(){
    loadObj();
    // readTGAFile();
})()

function loadObj(){
    const image = new TGA.TGAImage(1024,1024);
    const objFile = fs.readFileSync("./obj/african_head/african_head.obj",{ encoding: 'utf8' });
    const texture = new TGALoader(fs.readFileSync("./obj/african_head/african_head_diffuse.tga"));
    
    var mesh = new OBJ.Mesh(objFile);

    // setCamera, calculate view matrix、projection matrix
    const cameraPos = new Vector(0,0,3);
    const targetPosition = new Vector(0,0,0);
    const up = new Vector(0,1,0);
    GL.createViewMatrix(cameraPos,targetPosition,up);
    GL.createProjectionMatrix(-0.5,0.5,-0.5,0.5,1,0.5);
    GL.createViewportMatrix(0,0,image.width-1,image.height-1);
    let zBuffer = new Array(image.width*image.height);
    for (let i = 0; i < zBuffer.length; i++) {
        zBuffer[i] = Number.MIN_SAFE_INTEGER;
    }

    let lightDir = new Vector(0,0,1);

    
    let worldCoordinates = [];
    let uvCoordinates = [];
    for (let i = 0,j=0; i < mesh.vertices.length && j < mesh.textures.length; i+=3,j+=2) {
        worldCoordinates.push(new Vector(mesh.vertices[i],mesh.vertices[i+1],mesh.vertices[i+2]));
        uvCoordinates.push(new Vector(mesh.textures[j],mesh.textures[j+1]));
    }


    for (let i = 0; i < mesh.indices.length; i+=3) {
        const point1 = worldCoordinates[mesh.indices[i]];
        const point2 = worldCoordinates[mesh.indices[i+1]];
        const point3 = worldCoordinates[mesh.indices[i+2]];

        const uv1 = uvCoordinates[mesh.indices[i]];
        const uv2 = uvCoordinates[mesh.indices[i+1]];
        const uv3 = uvCoordinates[mesh.indices[i+2]];

        const ab = Vector.sub(worldCoordinates[mesh.indices[i+1]],worldCoordinates[mesh.indices[i]]);
        const ac = Vector.sub(worldCoordinates[mesh.indices[i+2]],worldCoordinates[mesh.indices[i]]);
        let normal = Vector.cross(ab,ac).normalize();
        
        let intensity = normal.x*lightDir.x+normal.y*lightDir.y+normal.z*lightDir.z;
        // console.log(intensity);
        if(intensity > 0){
            GL.drawTriangle([point1,point2,point3],[uv1,uv2,uv3],texture,zBuffer,
                image,new TGAColor(255*intensity,255*intensity,255*intensity,255));
        }
        
    }

    image.output();
}

function readTGAFile(){
    const image = new TGA.TGAImage(1024,1024);
    const tgaFile = new TGA.TGALoader(fs.readFileSync("./african_head_diffuse.tga"))
    // for (let i = 0; i < tgaFile.pixels.length; i+=4) {
    //     if(tgaFile.pixels[i] > 0){
    //         console.log(i);
    //     }
    // }
    
    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let index = i * image.width + j;
            index = index * 4;
            image.set(j,i,new TGAColor(tgaFile.pixels[index],tgaFile.pixels[index+1],tgaFile.pixels[index+2],tgaFile[index+3]));
            // image.set(j,i,redColor)
        }
    }
    image.output();
}

function drawTriangle(){
    const image = new TGA.TGAImage(100,100);
    let points = [];
    points.push(new Vector(10,0));
    points.push(new Vector(40,0));
    points.push(new Vector(40,60));
    GL.drawTriangle(points,image,redColor);
    image.output();
}
