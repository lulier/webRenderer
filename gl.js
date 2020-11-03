const math = require("./vector");
const { Vector } = require("./vector");
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

    static drawTriangle(points,image,color){
        let boxMin = new math.Vector(image.width - 1,image.height - 1);
        let boxMax = new math.Vector(0,0);
        for (let i = 0; i < points.length; i++) {
            boxMin.x = Math.max(0,Math.min(boxMin.x,points[i].x));
            boxMin.y = Math.max(0,Math.min(boxMin.y,points[i].y));

            boxMax.x = Math.min(image.width - 1,Math.max(boxMax.x,points[i].x));
            boxMax.y = Math.min(image.height - 1,Math.max(boxMax.y,points[i].y));
        }

        let tempVector = new Vector(0,0);
        for (let i = boxMin.x; i <= boxMax.x; i++) {
            for (let j = boxMin.y; j <= boxMax.y; j++) {
                
                tempVector.x = i;
                tempVector.y = j;
                let bc = this.barycentric(points,tempVector);
                // console.log(bc);
                if(bc.x < 0 || bc.y < 0 || bc.z < 0){
                    continue;
                }
                image.set(i,j,color);
            }
        }
    }

    static barycentric(points,point){
        let result = Vector.cross(new Vector(points[1].x - points[0].x,points[2].x - points[0].x,points[0].x - point.x),
                            new Vector(points[1].y - points[0].y,points[2].y - points[0].y,points[0].y - point.y));
        return new Vector(1-(result.x+result.y)/result.z,result.y/result.z,result.x/result.z);
    }
}

module.exports = GL;

