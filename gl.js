const math = require("./vector");
const { Vector, Matrix } = require("./vector");
const { TGAColor } = require("./tga");
const vector = require("./vector");

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

    static drawTriangle(worldPositions,uvCoordinates,vertextNormals,texture,zBuffer,image,color){
        let screenPositions = worldPositions.map((position,index)=>{
            return Shader.vertext(position);
        });

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
                tempVector.z = screenPositions[0].z * bc.x + screenPositions[1].z * bc.y + screenPositions[2].z * bc.z;
                // console.log(bc);
                if(bc.x < 0 || bc.y < 0 || bc.z < 0){
                    continue;
                }

                if(tempVector.z > zBuffer[i+image.width*j]){
                    Shader.varying_uv.u = uvCoordinates[0].x * bc.x + uvCoordinates[1].x * bc.y + uvCoordinates[2].x * bc.z;
                    Shader.varying_uv.v = uvCoordinates[0].y * bc.x + uvCoordinates[1].y * bc.y + uvCoordinates[2].y * bc.z;

                    Shader.varying_uv.u = Math.round(Shader.varying_uv.u * (texture.width - 1));
                    Shader.varying_uv.v = Math.round(Shader.varying_uv.v * (texture.height - 1));


                    // to do vertextNormal 不能直接使用，需要做变换
                    Shader.varying_normal.x = vertextNormals[0].x * bc.x + vertextNormals[1].x * bc.y + vertextNormals[2].x * bc.z;
                    Shader.varying_normal.y = vertextNormals[0].y * bc.x + vertextNormals[1].y * bc.y + vertextNormals[2].y * bc.z;
                    Shader.varying_normal.z = vertextNormals[0].z * bc.x + vertextNormals[1].z * bc.y + vertextNormals[2].z * bc.z;
                    Shader.varying_normal.normalize();
                    
                    const {discard,finalColor} = Shader.fragment(texture,color);
                    if(!discard){
                        zBuffer[i+image.width*j] = tempVector.z;
                        image.set(i,j,finalColor);
                    }
                }
                
            }
        }
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
            [0,0,depth/2,depth/2],
            [0,0,0,1]
        ]);
    
        GL.viewportMatrix = matrix;
    }
    
    // 创建视图矩阵
    static createViewMatrix(cameraPos,targetPosition,up){
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
GL.lightDir = new Vector(0,0,1);
GL.cameraPos = new Vector(0,0,3);

class Shader{

    static vertext(worldPosition){
        // 将本地坐标转为屏幕坐标
        // screen = viewport * projection * view * model * local
        let matrix1 = Matrix.mul(GL.viewportMatrix,GL.projectionMatrix);
        let matrix2 = Matrix.mul(matrix1,GL.modelViewMatrix);
        let temp = matrix2.mulV(worldPosition);
        
        temp.x = Math.round(temp.x / temp.w);
        temp.y = Math.round(temp.y / temp.w);
        temp.z = temp.z / temp.w;
        
        return temp;
    }

    static fragment(texture,color){
        let tempColor = new TGAColor(color.r,color.g,color.b,255);
        let ambient = 0.1;
        let diffuse = Math.max(0,Vector.dot(Shader.varying_normal,GL.lightDir));
        let specular = 0.1;
        let lightArg = ambient + diffuse + specular;
        tempColor.r = tempColor.r * lightArg;
        tempColor.g = tempColor.g * lightArg;
        tempColor.b = tempColor.b * lightArg;

       
        let pixelIndex = Shader.varying_uv.u+Shader.varying_uv.v*texture.width;
        let baseMap = new TGAColor(texture.pixels[pixelIndex*4],texture.pixels[pixelIndex*4+1],texture.pixels[pixelIndex*4+2],texture.pixels[pixelIndex*4+3]);
        tempColor.r = baseMap.r * tempColor.r / 255;
        tempColor.g = baseMap.g * tempColor.g / 255;
        tempColor.b = baseMap.b * tempColor.b / 255;
        tempColor.a = baseMap.a * tempColor.a / 255;

        return {discard:false,finalColor:tempColor}
    }
}

// 这样写是没法并行执行的
Shader.varying_uv = {u:1,v:1};

Shader.varying_normal = new Vector(0,0,1);

module.exports = GL;

