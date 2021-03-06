var fs = require('fs');
const TGA = require('./tga');
const math = require("./vector");
const { Vector, Matrix } = require('./vector');
const OBJ = require('webgl-obj-loader');
const { TGAColor, TGALoader } = require('./tga');
const vector = require('./vector');
const tga = require('./tga');
const Model = require('./model');
const { GL,Shader } = require('./gl');

const whiteColor = new TGA.TGAColor(255,255,255,255);
const redColor = new TGA.TGAColor(255,0,0,255);
const blackColor = new TGA.TGAColor(0,0,0,255);

(function(){
    // init gl setting
    GL.cameraPos = new Vector(0.7,0.7,2);
    GL.lightPos = new Vector(1,2,1);
    GL.lightDir = new Vector(0,1,2);
    const image = new TGA.TGAImage(1024,1024);
    let zBuffer = new Array(image.width*image.height);
    for (let i = 0; i < zBuffer.length; i++) {
        zBuffer[i] = Number.MAX_SAFE_INTEGER;
    }
    
    const modelEI = new Model('african_head_eye_inner');
    renderObj(image,modelEI,zBuffer,false);

    const model = new Model('african_head');
    
    rednerShadow(model);
    renderObj(image,model,zBuffer,true);

    
})()

function renderObj(image,model,zBuffer,shouldOutput){
    const targetPosition = new Vector(0,0,0);
    const up = new Vector(0,1,0);
    GL.createViewMatrix(GL.cameraPos,targetPosition,up);
    GL.createProjectionMatrix(-0.5,0.5,-0.5,0.5,1,3);
    GL.createViewportMatrix(0,0,image.width-1,image.height-1);

    let mesh = model.mesh;
    let worldCoordinates = model.worldCoordinates;
    let uvCoordinates = model.uvCoordinates;
    let vertexNormals = model.vertexNormals;
    let vertexTangent = model.vertexTangent;
    let vertexBitangent = model.vertexBitangent;

    let shader = new Shader();
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
    
        GL.drawTriangle(shader,[point1,point2,point3],
            [uv1,uv2,uv3],
            [normal1,normal2,normal3],
            [tangent1,tangent2,tangent3],
            [bitangent1,bitangent2,bitangent3],
            model,zBuffer,
            image,new TGAColor(255,255,255,255));
        
    }

    if(shouldOutput){
        image.output();
    }
}

function rednerShadow(model){
    const image = new TGA.TGAImage(1024,1024);
    const targetPosition = new Vector(0,0,0);
    const up = new Vector(0,1,0);
    GL.createViewMatrix(GL.lightDir,targetPosition,up);
    GL.createProjectionMatrix(-0.5,0.5,-0.5,0.5,1,3);
    GL.createViewportMatrix(0,0,image.width-1,image.height-1);

    Shader.uniform_ShadowMatrix = Matrix.mul(GL.viewportMatrix,Matrix.mul(GL.projectionMatrix,GL.modelViewMatrix));

    let zBuffer = new Array(image.width*image.height);
    for (let i = 0; i < zBuffer.length; i++) {
        zBuffer[i] = Number.MAX_SAFE_INTEGER;
    }

    let mesh = model.mesh;
    let worldCoordinates = model.worldCoordinates;
    let uvCoordinates = model.uvCoordinates;
    let vertexNormals = model.vertexNormals;
    let vertexTangent = model.vertexTangent;
    let vertexBitangent = model.vertexBitangent;

    let shader = new Shader(Shader.cameraVertex,()=>{
        return {discard:false,finalColor:new TGAColor(0,0,0,255)}
    });

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
    
        GL.drawTriangle(shader,[point1,point2,point3],
            [uv1,uv2,uv3],
            [normal1,normal2,normal3],
            [tangent1,tangent2,tangent3],
            [bitangent1,bitangent2,bitangent3],
            model,zBuffer,
            image,new TGAColor(255,255,255,255));
        
    }

    model.setShadowMap(zBuffer);
}

function readTGAFile(){
    const image = new TGA.TGAImage(1024,1024);
    const tgaFile = new TGA.TGALoader(fs.readFileSync("./stoneHead_diffuse.tga"))
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
            // console.log(tgaFile.pixels[index+3]);
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
