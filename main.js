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
    const normalMap = new TGALoader(fs.readFileSync("./obj/african_head/african_head_nm_tangent.tga"));
    // const normalMap = new TGALoader(fs.readFileSync("./obj/african_head/african_head_nm.tga"));
    const specularMap = new TGALoader(fs.readFileSync("./obj/african_head/african_head_spec.tga"));
    
    var mesh = new OBJ.Mesh(objFile);
    mesh.calculateTangentsAndBitangents();

    // init gl setting
    GL.cameraPos = new Vector(0.7,0.7,2.2);
    GL.lightPos = new Vector(1,1,1);
    GL.lightDir = new Vector(1,1,0);
    const targetPosition = new Vector(0,0,0);
    const up = new Vector(0,1,0);
    GL.createViewMatrix(GL.cameraPos,targetPosition,up);
    GL.createProjectionMatrix(-0.5,0.5,-0.5,0.5,1,0.5);
    GL.createViewportMatrix(0,0,image.width-1,image.height-1);
    let zBuffer = new Array(image.width*image.height);
    for (let i = 0; i < zBuffer.length; i++) {
        zBuffer[i] = Number.MIN_SAFE_INTEGER;
    }

    let worldCoordinates = [];
    let uvCoordinates = [];
    let vertexNormals = [];
    let vertexTangent = [];
    let vertexBitangent = [];
    for (let i = 0,j=0; i < mesh.vertices.length && j < mesh.textures.length; i+=3,j+=2) {
        worldCoordinates.push(new Vector(mesh.vertices[i],mesh.vertices[i+1],mesh.vertices[i+2]));
        uvCoordinates.push(new Vector(mesh.textures[j],mesh.textures[j+1]));
        vertexNormals.push(new Vector(mesh.vertexNormals[i],mesh.vertexNormals[i+1],mesh.vertexNormals[i+2]));
        vertexTangent.push(new Vector(mesh.tangents[i],mesh.tangents[i+1],mesh.tangents[i+2]));
        vertexBitangent.push(new Vector(mesh.bitangents[i],mesh.bitangents[i+1],mesh.bitangents[i+2]));
    }


    // iterate to draw all triangles
    for (let i = 0; i < mesh.indices.length; i+=3) {
        const point1 = worldCoordinates[mesh.indices[i]];
        const point2 = worldCoordinates[mesh.indices[i+1]];
        const point3 = worldCoordinates[mesh.indices[i+2]];

        const uv1 = uvCoordinates[mesh.indices[i]];
        const uv2 = uvCoordinates[mesh.indices[i+1]];
        const uv3 = uvCoordinates[mesh.indices[i+2]];

        const normal1 = vertexNormals[mesh.indices[i]];
        const normal2 = vertexNormals[mesh.indices[i+1]];
        const normal3 = vertexNormals[mesh.indices[i+2]];

        const tangent1 = vertexTangent[mesh.indices[i]];
        const tangent2 = vertexTangent[mesh.indices[i+1]];
        const tangent3 = vertexTangent[mesh.indices[i+2]];

        const bitangent1 = vertexBitangent[mesh.indices[i]];
        const bitangent2 = vertexBitangent[mesh.indices[i+1]];
        const bitangent3 = vertexBitangent[mesh.indices[i+2]];
    
        GL.drawTriangle([point1,point2,point3],
            [uv1,uv2,uv3],
            [normal1,normal2,normal3],
            [tangent1,tangent2,tangent3],
            [bitangent1,bitangent2,bitangent3],
            texture,normalMap,specularMap,zBuffer,
            image,new TGAColor(255,255,255,255));
        
    }

    image.output();
}

function readTGAFile(){
    const image = new TGA.TGAImage(1024,1024);
    const tgaFile = new TGA.TGALoader(fs.readFileSync("./african_head_spec.tga"))
    // for (let i = 0; i < tgaFile.pixels.length; i+=4) {
    //     if(tgaFile.pixels[i] > 0){
    //         console.log(i);
    //     }
    // }
    
    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let index = i * image.width + j;
            index = index * 4;
            // image.set(j,i,new TGAColor(tgaFile.pixels[index],tgaFile.pixels[index+1],tgaFile.pixels[index+2],tgaFile[index+3]));
            image.set(j,i,new TGAColor(tgaFile.pixels[index],tgaFile.pixels[index+1],tgaFile.pixels[index+2],tgaFile[index+3]))
            // console.log(tgaFile.pixels[index]);
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
