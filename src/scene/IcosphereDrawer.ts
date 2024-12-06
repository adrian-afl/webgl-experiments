import { mat3, mat4, quat, vec3 } from "gl-matrix";

import { glmTemp } from "../glmTemporaryPools.ts";
import {
  GPUApiInterface,
  Geometry,
  ShaderProgram,
} from "../gpu/GPUApiInterface.ts";
import { Camera } from "./Camera.ts";

interface IcoSphereDescriptionType {
  levelsMeshes: string[];
  positionMatrices: {
    center: vec3;
    mat3: mat3;
  }[];
}

interface LoadedIcoSphereDescriptionType {
  geometries: Geometry[];
  positionMatrices: {
    center: vec3;
    mat4: mat4;
  }[];
}

export class IcosphereDrawer {
  private loaded!: LoadedIcoSphereDescriptionType;
  private shader!: ShaderProgram<{
    scale: true;
    centers: true;
    matrices: true;
    sphereCenter: true;
    perspectiveMatrix: true;
    viewMatrix: true;
    index: true;
  }>;
  // private translatedCenters: vec4[] = [];
  private translatedCentersBuffer = new Float32Array(4 * 320);
  private matricesBuffer = new Float32Array(4 * 4 * 320);

  public constructor(private readonly api: GPUApiInterface) {}

  public async initialize(): Promise<void> {
    const response = await fetch("icosphere/icosphere.json");
    const data = (await response.json()) as IcoSphereDescriptionType;
    const geometries: Geometry[] = [];
    for (const mesh of data.levelsMeshes) {
      const binResponse = await fetch(`icosphere/${mesh}`);
      const bin = await binResponse.arrayBuffer();
      geometries.push(await this.api.createGeometry(new Float32Array(bin)));
    }
    this.loaded = {
      geometries,
      positionMatrices: data.positionMatrices.map(({ center, mat3: m }) => {
        quat.setAxisAngle(glmTemp.quat[0], [1, 0, 0], Math.PI / 2);
        mat3.fromQuat(glmTemp.mat3[0], glmTemp.quat[0]);
        mat3.mul(m, m, glmTemp.mat3[0]);
        const tmp = mat4.fromValues(
          m[0],
          m[1],
          m[2],

          0,
          m[3],
          m[4],
          m[5],

          0,
          m[6],
          m[7],
          m[8],
          0,

          0,
          0,
          0,
          1
        );
        return { center, mat4: tmp };
      }),
    };

    // for (let i = 0; i < this.loaded.positionMatrices.length; i++) {
    //   this.translatedCenters.push(vec4.create());
    // }

    this.shader = await this.api.createShader(
      "entrypoints/icosphere/icosphere.vert",
      "entrypoints/icosphere/icosphere.frag",
      {
        scale: true,
        centers: true,
        matrices: true,
        sphereCenter: true,
        perspectiveMatrix: true,
        viewMatrix: true,
        index: true,
      }
    );

    await this.setMatricesUniform();
  }

  private async setMatricesUniform(): Promise<void> {
    await this.shader.use();
    const count = this.loaded.positionMatrices.length;
    for (let i = 0; i < count; i++) {
      this.matricesBuffer.set(this.loaded.positionMatrices[i].mat4, i * 4 * 4);
    }
    await this.shader.setUniformMatrixArray(
      "matrices",
      4,
      false,
      this.matricesBuffer
    );
  }

  private async updateCentersAndSetCentersUniform(
    sphereCenter: vec3,
    scale: number,
    cameraPosition: vec3
  ): Promise<void> {
    const tmp = glmTemp.vec3[0];
    const tmp2 = glmTemp.vec3[1];
    const tmp3 = glmTemp.vec3[2];
    vec3.sub(tmp, sphereCenter, cameraPosition);
    const count = this.loaded.positionMatrices.length;
    for (let i = 0; i < count; i++) {
      vec3.scale(tmp2, this.loaded.positionMatrices[i].center, scale);
      vec3.add(tmp3, tmp, tmp2);
      this.translatedCentersBuffer.set(tmp3, i * 4);
      // vec4.set(this.translatedCenters[i], tmp2[0], tmp2[1], tmp2[2], 0.0);
    }
    await this.shader.setUniformArray(
      "centers",
      "float",
      4,
      this.translatedCentersBuffer
    );
  }

  // triangle edge is 0.5, so i think this should be taken into consideration beforehand
  // distance to center of the triangle from the vertex is 0.28833
  // the min max of centers across all axes are -1.5665311813354492 and 1.5665311813354492
  // when being on the very edge of the triangle, all trnagles at the edge must be rendered, so the first transition must be after 0.28833
  // SO FAR there are 5 levels, so 4 threshold are needed, 4 transitions
  private distanceSteps = [0.3, 0.5, 0.7, 1.0];

  private getGeometry(distance: number, scale: number): Geometry {
    for (let i = 0; i < this.distanceSteps.length; i++) {
      if (distance < this.distanceSteps[i] * scale) {
        return this.loaded.geometries[i];
      }
    }
    // console.log(distance, scale, "too far");
    return this.loaded.geometries[this.loaded.geometries.length - 1];
  }

  public async draw(
    position: vec3,
    scale: number,
    camera: Camera
  ): Promise<void> {
    await this.shader.use();

    await this.updateCentersAndSetCentersUniform(
      position,
      scale,
      camera.position
    );
    await this.shader.setUniform("scale", "float", [scale]);
    await this.shader.setUniform("sphereCenter", "float", [
      position[0],
      position[1],
      position[2],
    ]);
    await camera.setUniforms(this.shader);
    const count = this.loaded.positionMatrices.length;
    await this.api.setCullFace("none");
    for (let i = 0; i < count; i++) {
      await this.shader.setUniform("index", "int", [i]);
      vec3.scale(
        glmTemp.vec3[0],
        this.loaded.positionMatrices[i].center,
        scale
      );
      vec3.add(glmTemp.vec3[1], position, glmTemp.vec3[0]);
      const distance = vec3.distance(glmTemp.vec3[1], camera.position);
      const geometry = this.getGeometry(distance, scale);
      await geometry.draw();
    }
    await this.api.setCullFace("back");
  }
}
