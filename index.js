 
const tga = new TGA();
tga.open('./textures/framebuffer.tga',()=>{
    var canvas = tga.getCanvas();
	document.body.appendChild(canvas);
})