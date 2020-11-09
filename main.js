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
    const image = new TGA.TGAImage(1024,1024);
    const objFile = fs.readFileSync("./obj/african_head/african_head.obj",{ encoding: 'utf8' });
    const texture = new TGALoader(fs.readFileSync("./obj/african_head/african_head_diffuse.tga"));
    
    var mesh = new OBJ.Mesh(objFile);

    // setCamera, calculate view matrix、projection matrix
    const cameraPos = new Vector(0,0,3);
    const targetPosition = new Vector(0,0,0);
    const up = new Vector(0,1,0);
    const modelViewMatrix = createViewMatrix(cameraPos,targetPosition,up);
    const projectionMatrix = createProjectionMatrix(-0.5,0.5,-0.5,0.5,1,0.5);
    const viewportMatrix = createViewportMatrix(0,0,image.width-1,image.height-1);

    
    let screenCoordinates = [];
    let worldCoordinates = [];
    let uvCoordinates = [];
    for (let i = 0,j=0; i < mesh.vertices.length && j < mesh.textures.length; i+=3,j+=2) {
        
        screenCoordinates.push(getScreenCoordinate(mesh.vertices[i],mesh.vertices[i+1],mesh.vertices[i+2],
            modelViewMatrix,projectionMatrix,viewportMatrix));
        worldCoordinates.push(new Vector(mesh.vertices[i],mesh.vertices[i+1],mesh.vertices[i+2]));
        uvCoordinates.push(new Vector(mesh.textures[j],mesh.textures[j+1]));
    }

    let zBuffer = new Array(image.width*image.height);
    for (let i = 0; i < zBuffer.length; i++) {
        zBuffer[i] = Number.MIN_SAFE_INTEGER;
    }

    for (let i = 0; i < mesh.indices.length; i+=3) {
        const point1 = screenCoordinates[mesh.indices[i]];
        const point2 = screenCoordinates[mesh.indices[i+1]];
        const point3 = screenCoordinates[mesh.indices[i+2]];

        const uv1 = uvCoordinates[mesh.indices[i]];
        const uv2 = uvCoordinates[mesh.indices[i+1]];
        const uv3 = uvCoordinates[mesh.indices[i+2]];

        const ab = Vector.sub(worldCoordinates[mesh.indices[i+1]],worldCoordinates[mesh.indices[i]]);
        const ac = Vector.sub(worldCoordinates[mesh.indices[i+2]],worldCoordinates[mesh.indices[i]]);
        let normal = Vector.cross(ab,ac).normalize();

        let lightDir = new Vector(0,0,1);
        let intensity = normal.x*lightDir.x+normal.y*lightDir.y+normal.z*lightDir.z;
        // console.log(intensity);
        if(intensity > 0){
            GL.drawTriangle([point1,point2,point3],[uv1,uv2,uv3],texture,zBuffer,
                image,new TGAColor(255*intensity,255*intensity,255*intensity,255));
        }
        
    }

    image.output();
}

function getScreenCoordinate(x,y,z,modelViewMatrix,projectionMatrix,viewportMatrix){
    // 将本地坐标转为屏幕坐标
    // screen = viewport * projection * view * model * local
    let matrix1 = Matrix.mul(viewportMatrix,projectionMatrix);
    let matrix2 = Matrix.mul(matrix1,modelViewMatrix);
    let temp = matrix2.mulV(new Vector(x,y,z));
    // let temp = viewportMatrix.mulV(new Vector(x,y,z));
    temp.x = Math.round(temp.x / temp.w);
    temp.y = Math.round(temp.y / temp.w);
    temp.z = temp.z / temp.w;
    return temp;
}

function createViewportMatrix(startx,starty,width,height){
    const depth = 255;
    const matrix = new Matrix([
        [width/2,0,0,width/2+startx],
        [0,height/2,0,height/2+starty],
        [0,0,depth/2,depth/2],
        [0,0,0,1]
    ]);

    return matrix;
}

// 创建视图矩阵
function createViewMatrix(cameraPos,targetPosition,up){
    const forward = Vector.sub(cameraPos,targetPosition).normalize();
    const right = Vector.cross(forward,up)
    const realUp = Vector.cross(right,forward);

    const leftMatrix = new Matrix([
        [right.x,right.y,right.z,0],
        [realUp.x,realUp.y,realUp.z,0],
        [forward.x,forward.y,forward.z,0],
        [0,0,0,1]
    ])

    const rightMatrix = new Matrix([
        [1,0,0,-cameraPos.x],
        [0,1,0,-cameraPos.y],
        [0,0,1,-cameraPos.z],
        [0,0,0,1]
    ])

    return Matrix.mul(leftMatrix,rightMatrix);
}


// 创建投影矩阵
// http://www.songho.ca/opengl/gl_projectionmatrix.html
function createProjectionMatrix(left,right,bottom,top,near,far){

    return new Matrix([
        [2*near/(right - left),0,(right + left)/(right - left),0],
        [0,2*near/(top - bottom),(top + bottom)/(top - bottom),0],
        [0,0,-(far + near)/(far - near),-2*far*near/(far - near)],
        [0,0,-1,0]
    ]);
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
