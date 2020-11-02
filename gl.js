class GL {
    static drawLine(x1,y1,x2,y2,image,color){
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
        let deltaY = Math.abs(y2-y1) * 2;
        let doubleDeltaX = deltaX * 2;
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
                tempY -= doubleDeltaX;
                // tempY = 0;
            }
        }
    }
}

module.exports = GL;

