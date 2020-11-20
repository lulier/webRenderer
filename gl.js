const math = require("./vector");
const { Vector, Matrix } = require("./vector");
const { TGAColor, TGALoader, TGAImage } = require("./tga");
const vector = require("./vector");
const { glMatrix, mat3} = require("gl-matrix");
var fs = require('fs');
const { globalAgent } = require("https");

class GL {

    static drawLine(vector1,vector2,image,color){
        let x1 = vector1.x,y1 = vector1.y,x2 = vector2.x,y2 = vector2.y;
        let steep = false;
        let temp = 0;
        if(Math.abs(x2-x1) < Math.abs(y2-y1)){
            steep = true;
            temp = x1;
            x1 = y1;
            y1 = temp;

            temp = x2;
            x2 = y2;
            y2 = temp;
        }

        if(x1 > x2){
            temp = x1;
            x1 = x2;
            x2 = temp;

            temp = y1;
            y1 = y2;
            y2 = temp;
        }

        let deltaX = x2-x1;
        let deltaY = Math.abs(y2-y1);
        let tempY = 0;
        let y = y1;
        for (let x = x1; x <= x2; x++) {
            if(steep){
                image.set(y,x,color);
            } else {
                image.set(x,y,color);
            }
            tempY += deltaY;
    
            if(tempY > deltaX){
                y += (y2>y1?1:-1);
                tempY -= deltaX;
            }
        }
    }

    static drawTriangle(shader,worldPositions,uvCoordinates,vertexNormals,tangents,bitangents,model,zBuffer,image,lightColor){
        let clipPositions = worldPositions.map((position,index)=>{
            return shader.vertex(position);
        });

        let ndcPositions = clipPositions.map((position,index)=>{
            return new Vector(position.x,position.y,position.z,position.w);
        });

        let screenPositions = clipPositions.map((position,index)=>{
            let temp = GL.viewportMatrix.mulV(position);
            temp.x = Math.round(temp.x / temp.w);
            temp.y = Math.round(temp.y / temp.w);
            temp.z = temp.z / temp.w;
            return temp;
        })

        let boxMin = new math.Vector(image.width - 1,image.height - 1);
        let boxMax = new math.Vector(0,0);
        for (let i = 0; i < screenPositions.length; i++) {
            boxMin.x = Math.max(0,Math.min(boxMin.x,screenPositions[i].x));
            boxMin.y = Math.max(0,Math.min(boxMin.y,screenPositions[i].y));

            boxMax.x = Math.min(image.width - 1,Math.max(boxMax.x,screenPositions[i].x));
            boxMax.y = Math.min(image.height - 1,Math.max(boxMax.y,screenPositions[i].y));
        }

        let tempVector = new Vector(0,0,0);
        for (let i = boxMin.x; i <= boxMax.x; i++) {
            for (let j = boxMin.y; j <= boxMax.y; j++) {
                tempVector.x = i;
                tempVector.y = j;
                let bc = this.barycentric(screenPositions,tempVector);
                
                // console.log(bc);
                if(bc.x < 0 || bc.y < 0 || bc.z < 0){
                    continue;
                }

                // https://github.com/ssloy/tinyrenderer/wiki/Technical-difficulties-linear-interpolation-with-perspective-deformations
                let bc_clip = new Vector(bc.x,bc.y,bc.z);
                bc_clip.x = bc_clip.x / clipPositions[0].w;
                bc_clip.y = bc_clip.y / clipPositions[1].w;
                bc_clip.z = bc_clip.z / clipPositions[2].w;

                let tempValue = bc_clip.x + bc_clip.y + bc_clip.z;
                bc_clip.x = bc_clip.x / tempValue;
                bc_clip.y = bc_clip.y / tempValue;
                bc_clip.z = bc_clip.z / tempValue;

                bc = bc_clip;

                tempVector.z = screenPositions[0].z * bc.x + screenPositions[1].z * bc.y + screenPositions[2].z * bc.z;
                if(tempVector.z < zBuffer[i+image.width*j]){
                    // init varying variable
                    Shader.varying_uv.u = uvCoordinates[0].x * bc.x + uvCoordinates[1].x * bc.y + uvCoordinates[2].x * bc.z;
                    Shader.varying_uv.v = uvCoordinates[0].y * bc.x + uvCoordinates[1].y * bc.y + uvCoordinates[2].y * bc.z;

                    // 因为当前的model matrix是单位矩阵，所以normal变量可以不变换直接使用
                    Shader.varying_normal.x = vertexNormals[0].x * bc.x + vertexNormals[1].x * bc.y + vertexNormals[2].x * bc.z;
                    Shader.varying_normal.y = vertexNormals[0].y * bc.x + vertexNormals[1].y * bc.y + vertexNormals[2].y * bc.z;
                    Shader.varying_normal.z = vertexNormals[0].z * bc.x + vertexNormals[1].z * bc.y + vertexNormals[2].z * bc.z;
                    Shader.varying_normal.normalize();

                    let tangent = new Vector(1,0,0);
                    let bitangent = new Vector(0,1,0);
                    
                    tangent.x = tangents[0].x * bc.x + tangents[1].x * bc.y + tangents[2].x * bc.z;
                    tangent.y = tangents[0].y * bc.x + tangents[1].y * bc.y + tangents[2].y * bc.z;
                    tangent.z = tangents[0].z * bc.x + tangents[1].z * bc.y + tangents[2].z * bc.z;

                    bitangent.x = bitangents[0].x * bc.x + bitangents[1].x * bc.y + bitangents[2].x * bc.z;
                    bitangent.y = bitangents[0].y * bc.x + bitangents[1].y * bc.y + bitangents[2].y * bc.z;
                    bitangent.z = bitangents[0].z * bc.x + bitangents[1].z * bc.y + bitangents[2].z * bc.z;


                    tangent.normalize();
                    bitangent.normalize();

                    Shader.varying_tbn = new Matrix([
                        [tangent.x,tangent.y,tangent.z,0],
                        [bitangent.x,bitangent.y,bitangent.z,0],
                        [Shader.varying_normal.x,Shader.varying_normal.y,Shader.varying_normal.z,0],
                        [0,0,0,1]
                    ]);

                    Shader.varying_fragPos.x = worldPositions[0].x * bc.x + worldPositions[1].x * bc.y + worldPositions[2].x * bc.z;
                    Shader.varying_fragPos.y = worldPositions[0].y * bc.x + worldPositions[1].y * bc.y + worldPositions[2].y * bc.z;
                    Shader.varying_fragPos.z = worldPositions[0].z * bc.x + worldPositions[1].z * bc.y + worldPositions[2].z * bc.z;


                    const {discard,finalColor} = shader.fragment(model,lightColor);
                    if(!discard){
                        zBuffer[i+image.width*j] = tempVector.z;
                        image.set(i,j,finalColor);
                    }
                }
                
            }
        }
    }

    static calculateTangent(worldPositions,uvCoordinates){
        let tangent = new Vector(1,0,0);
        let bitangent = new Vector(1,0,0);
        let edge1 = Vector.sub(worldPositions[1],worldPositions[0]);
        let edge2 = Vector.sub(worldPositions[2],worldPositions[0]);
        let deltaUV1 = Vector.sub(uvCoordinates[1],uvCoordinates[0]);
        let deltaUV2 = Vector.sub(uvCoordinates[2],uvCoordinates[0]);
        
        const rInv = deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y;
        let f = 1.0 / Math.abs(rInv < 0.0001 ? 1.0 : rInv);
        tangent.x = f * (deltaUV2.y * edge1.x - deltaUV1.y * edge2.x);
        tangent.y = f * (deltaUV2.y * edge1.y - deltaUV1.y * edge2.y);
        tangent.z = f * (deltaUV2.y * edge1.z - deltaUV1.y * edge2.z);

        bitangent.x = f * (-deltaUV2.x * edge1.x + deltaUV1.x * edge2.x);
        bitangent.y = f * (-deltaUV2.x * edge1.y + deltaUV1.x * edge2.y);
        bitangent.z = f * (-deltaUV2.x * edge1.z + deltaUV1.x * edge2.z);

        return {tangent:tangent.normalize(),bitangent:bitangent.normalize()};
    }

    static calculateTangentMatrix(worldPositions,uvCoordinates,normal){
        let ab = Vector.sub(worldPositions[1],worldPositions[0]);
        let ac = Vector.sub(worldPositions[2],worldPositions[0]);
        let tangent = new Vector(1,0,0);
        let bitangent = new Vector(0,1,0);

        let n = normal;
        let invertAI = mat3.create();
        let ai = mat3.fromValues(ab.x,ac.x,n.x,
            ab.y,ac.y,n.y,
            ab.z,ac.z,n.z);
        mat3.invert(invertAI,ai);
        
        let deltaU = new Vector(uvCoordinates[1].x - uvCoordinates[0].x,uvCoordinates[2].x - uvCoordinates[0].x,0);
        let deltaV = new Vector(uvCoordinates[1].y - uvCoordinates[0].y,uvCoordinates[2].y - uvCoordinates[0].y,0);

        tangent.x = invertAI[0] * deltaU.x + invertAI[3] * deltaU.y + invertAI[6] * deltaU.z;
        tangent.y = invertAI[1] * deltaU.x + invertAI[4] * deltaU.y + invertAI[7] * deltaU.z;
        tangent.z = invertAI[2] * deltaU.x + invertAI[5] * deltaU.y + invertAI[8] * deltaU.z;


        bitangent.x = invertAI[0] * deltaV.x + invertAI[3] * deltaV.y + invertAI[6] * deltaV.z;
        bitangent.y = invertAI[1] * deltaV.x + invertAI[4] * deltaV.y + invertAI[7] * deltaV.z;
        bitangent.z = invertAI[2] * deltaV.x + invertAI[5] * deltaV.y + invertAI[8] * deltaV.z;

        return {tangent:tangent.normalize(),bitangent:bitangent.normalize()};
    }

    static barycentric(points,point){
        let result = Vector.cross(new Vector(points[1].x - points[0].x,points[2].x - points[0].x,points[0].x - point.x),
                            new Vector(points[1].y - points[0].y,points[2].y - points[0].y,points[0].y - point.y));
        if(!result.z){
            return new Vector(-1,1,1);
        }

        return new Vector(1-(result.x+result.y)/result.z,result.x/result.z,result.y/result.z);
    }
    
    static createViewportMatrix(startx,starty,width,height){
        const depth = 255;
        const matrix = new Matrix([
            [width/2,0,0,width/2+startx],
            [0,height/2,0,height/2+starty],
            [0,0,1,0],
            [0,0,0,1]
        ]);
    
        GL.viewportMatrix = matrix;
    }
    
    // 创建视图矩阵
    static createViewMatrix(cameraPos,targetPosition,up){
        const forward = Vector.sub(cameraPos,targetPosition).normalize();
        const right = Vector.cross(up,forward).normalize();
        const realUp = Vector.cross(forward,right).normalize();
    
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
    
        GL.modelViewMatrix = Matrix.mul(leftMatrix,rightMatrix);
    }
    
    
    // 创建投影矩阵
    // http://www.songho.ca/opengl/gl_projectionmatrix.html
    static createProjectionMatrix(left,right,bottom,top,near,far){
    
        GL.projectionMatrix = new Matrix([
            [2*near/(right - left),0,(right + left)/(right - left),0],
            [0,2*near/(top - bottom),(top + bottom)/(top - bottom),0],
            [0,0,-(far + near)/(far - near),-2*far*near/(far - near)],
            [0,0,-1,0]
        ]);
    }
}

GL.modelViewMatrix = new Matrix();
GL.projectionMatrix = new Matrix();
GL.viewportMatrix = new Matrix();
GL.lightPos = new Vector(1,1,1);
GL.cameraPos = new Vector(0,0,3);
GL.lightDir = new Vector(1,1,1);

class Shader{

    constructor(vertex,fragment){
        if(vertex){
            this.vertex = vertex;
        } else {
            this.vertex = Shader.cameraVertex;
        }
        
        if(fragment){
            this.fragment = fragment;
        } else {
            this.fragment = Shader.cameraFragment;
        }
        
    }
}

Shader.uniform_ShadowMatrix = new Matrix();

// 这样写是没法并行执行的
Shader.varying_uv = {u:1,v:1};

Shader.varying_normal = new Vector(0,0,1);

Shader.varying_fragPos = new Vector(0,0,1);

Shader.varying_tbn = new Matrix();

Shader.cameraVertex = function (worldPosition){
    // 将本地坐标转为裁剪空间坐标
    // clip = projection * view * model * local
    let matrix = Matrix.mul(GL.projectionMatrix,GL.modelViewMatrix);
    let clip = matrix.mulV(worldPosition);        
    return clip;
}

Shader.cameraFragment = function(model,lightColor){
    let normal = model.getNormalMap(Shader.varying_uv.u,Shader.varying_uv.v);

    let tempColor = new TGAColor(lightColor.r,lightColor.g,lightColor.b,255);

    let lightDir = Shader.varying_tbn.mulV(GL.lightDir).normalize();
    
    let viewDir = Shader.varying_tbn.mulV(Vector.sub(GL.cameraPos,Shader.varying_fragPos)).normalize();

    // lightDir = GL.lightDir.normalize();
    // viewDir = Vector.sub(GL.cameraPos,Shader.varying_fragPos).normalize();

    // shadow calculation

    let shadowFactor = 1;
    if(model.shadowMap){
        let shadowScreenPosition = Shader.uniform_ShadowMatrix.mulV(Shader.varying_fragPos);
        shadowScreenPosition.x = Math.round(shadowScreenPosition.x/shadowScreenPosition.w);
        shadowScreenPosition.y = Math.round(shadowScreenPosition.y/shadowScreenPosition.w);
        shadowScreenPosition.z = shadowScreenPosition.z/shadowScreenPosition.w;
        let shadowIndex = shadowScreenPosition.x + 1024 * shadowScreenPosition.y;
        shadowFactor = 0.3 + 0.7 * (model.shadowMap[shadowIndex] >= shadowScreenPosition.z - 0.04?1:0);
    }


    let diffuse = Math.max(0,normal.x * lightDir.x+normal.y*lightDir.y+normal.z*lightDir.z) * 3;
    let halfVector = Vector.add(viewDir,lightDir).normalize();

    let specular = 1;
    if(model.specularMap){
        specular = Math.pow(Math.max(0,normal.x * halfVector.x+normal.y*halfVector.y+normal.z*halfVector.z),
            model.getSpecularMap(Shader.varying_uv.u,Shader.varying_uv.v)+5);
    }

    let baseMap = model.getBaseMap(Shader.varying_uv.u,Shader.varying_uv.v);
    tempColor.r = Math.min(20+baseMap.r*(diffuse+specular)*shadowFactor,255);
    tempColor.g = Math.min(20+baseMap.g*(diffuse+specular)*shadowFactor,255);
    tempColor.b = Math.min(20+baseMap.b*(diffuse+specular)*shadowFactor,255);
    return {discard:false,finalColor:tempColor}
}

module.exports = {GL,Shader};

