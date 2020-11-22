var fs = require('fs');
const OBJ = require('webgl-obj-loader');
const { TGAColor, TGALoader, TGAImage } = require('./tga');
const { Vector, Matrix } = require('./vector');

class Model{

    constructor(objName){
        this.loadModel(objName);
    }

    loadModel(objName){
        const objFile = fs.readFileSync(`./obj/${objName}/${objName}.obj`,{ encoding: 'utf8' });
        this.texture = new TGALoader(fs.readFileSync(`./obj/${objName}/${objName}_diffuse.tga`));
        this.normalMap = new TGALoader(fs.readFileSync(`./obj/${objName}/${objName}_nm_tangent.tga`));
        
        if(fs.existsSync(`./obj/${objName}/${objName}_spec.tga`)){
            this.specularMap = new TGALoader(fs.readFileSync(`./obj/${objName}/${objName}_spec.tga`));
        } else {
            this.specularMap = null;
        }

        this.mesh = new OBJ.Mesh(objFile);
        this.mesh.calculateTangentsAndBitangents();
        this.initVertexData();
    }

    setShadowMap(shadowBuffer){
        this.shadowMap = shadowBuffer;
    }

    initVertexData(){
        let mesh = this.mesh;
        this.worldCoordinates = [];
        this.uvCoordinates = [];
        this.vertexNormals = [];
        this.vertexTangent = [];
        this.vertexBitangent = [];

        for (let i = 0,j=0; i < mesh.vertices.length && j < mesh.textures.length; i+=3,j+=2) {
            // this.worldCoordinates.push(new Vector(mesh.vertices[i]/20,mesh.vertices[i+1]/20,mesh.vertices[i+2]/20));
            this.worldCoordinates.push(new Vector(mesh.vertices[i],mesh.vertices[i+1],mesh.vertices[i+2]));
            this.uvCoordinates.push(new Vector(mesh.textures[j],mesh.textures[j+1],0));
            this.vertexNormals.push(new Vector(mesh.vertexNormals[i],mesh.vertexNormals[i+1],mesh.vertexNormals[i+2]));
            this.vertexTangent.push(new Vector(mesh.tangents[i],mesh.tangents[i+1],mesh.tangents[i+2]));
            this.vertexBitangent.push(new Vector(mesh.bitangents[i],mesh.bitangents[i+1],mesh.bitangents[i+2]));
        }
    }

    getBaseMap(u,v){
        let tempUV = {u:1,v:1};
        tempUV.u = Math.round(u * (this.texture.width - 1));
        tempUV.v = Math.round(v * (this.texture.height - 1));
        let pixelIndex = tempUV.u+tempUV.v*this.texture.width;
        let color = new TGAColor(this.texture.pixels[pixelIndex*4],this.texture.pixels[pixelIndex*4+1],
            this.texture.pixels[pixelIndex*4+2],this.texture.pixels[pixelIndex*4+3]);
        return color;
    }

    getNormalMap(u,v){
        u < 0 ? u = 0: u = u;
        u > 1 ? u = 1: u = u;
        v < 0 ? v = 0: v = v;
        v > 1 ? v = 1: v = v;
        let tempUV = {u:1,v:1};
        tempUV.u = Math.round(u * (this.normalMap.width - 1));
        tempUV.v = Math.round(v * (this.normalMap.height - 1));
        let pixelIndex = tempUV.u+tempUV.v*this.normalMap.width;
        let normal = new Vector(this.normalMap.pixels[pixelIndex*4],this.normalMap.pixels[pixelIndex*4+1],
            this.normalMap.pixels[pixelIndex*4+2]);
        normal.x = normal.x / 255 * 2 -1;
        normal.y = normal.y / 255 * 2 -1;
        normal.z = normal.z / 255 * 2 -1;
        normal.normalize();
        return normal;
    }

    getSpecularMap(u,v){
        let tempUV = {u:1,v:1};
        tempUV.u = Math.round(u * (this.specularMap.width - 1));
        tempUV.v = Math.round(v * (this.specularMap.height - 1));
        let pixelIndex = tempUV.u+tempUV.v*this.specularMap.width;
        let specular = this.specularMap.pixels[pixelIndex*4];
        return specular;
    }
}

module.exports = Model;