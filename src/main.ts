import { quat, vec3 } from "gl-matrix";
import * as test from "node:test";

import { glmTemp } from "./glmTemporaryPools.ts";
import { GPUApiInterface } from "./gpu/GPUApiInterface.ts";
import { WebGLApiImplementation } from "./gpu/webgl/WebGLApiImplementation.ts";
import { Camera } from "./scene/Camera.ts";
import { IcosphereDrawer } from "./scene/IcosphereDrawer.ts";
import { Mesh } from "./scene/Mesh.ts";
import { SpotLight } from "./scene/SpotLight.ts";
import { MeshDeferredLightingStage } from "./stages/MeshDeferredLightingStage.ts";
import { MeshMRTStage } from "./stages/MeshMRTStage.ts";
import { OutputStage } from "./stages/OutputStage.ts";
import { lookAlongQuat, lookAtQuat } from "./util/lookAtQuat.ts";

if (document.location.search.includes("debug=true")) {
  void import("spectorjs").then((imported) => {
    const spector = new imported.Spector();
    spector.displayUI();
  });
}

async function initWebGL2(): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  document.body.appendChild(canvas);

  const api = new WebGLApiImplementation() as GPUApiInterface;
  await api.initialize(canvas, 1024, 1024, false);

  const dingusGeometry = await api.loadGeometry("dingus.obj");
  const dingusTexture = await api.loadTexture2D("dingus.jpg", {});
  const dingusMesh = new Mesh(dingusGeometry, dingusTexture);

  const groundGeometry = await api.loadGeometry("ground.obj");
  const groundMesh = new Mesh(groundGeometry, dingusTexture);

  const scene: Mesh[] = [];

  const meshStage = new MeshMRTStage(api);
  await meshStage.initialize();
  let meshStageOutputs = meshStage.getOutputs();

  const meshDeferredLightingState = new MeshDeferredLightingStage(api);
  await meshDeferredLightingState.initialize();

  const outputStage = new OutputStage(api);
  await outputStage.initialize();

  const startTime = Date.now();

  const defaultFramebuffer = await api.getDefaultFramebuffer();

  const camera = new Camera();
  camera.setPerspective(90, 1, 0.01, 1000);
  lookAlongQuat(camera.orientation, [0, 0, -1], [0, 1, 0]);
  vec3.set(camera.position, 0, 0.3, 5);

  const handleResizing = async (force: boolean): Promise<void> => {
    const size = await defaultFramebuffer.getSize();
    if (
      size.width !== document.body.clientWidth ||
      size.height !== document.body.clientHeight ||
      force
    ) {
      canvas.width = document.body.clientWidth;
      canvas.height = document.body.clientHeight;
      await defaultFramebuffer.resize(
        document.body.clientWidth,
        document.body.clientHeight
      );
      await meshStage.recreateTextures();
      meshStageOutputs = meshStage.getOutputs();
      const aspect = document.body.clientWidth / document.body.clientHeight;
      camera.setPerspective(70, aspect, 0.01, 1000);
    }
  };

  await handleResizing(true);

  const vec3Up: vec3 = [0, 1, 0];

  const lights: SpotLight[] = [];
  const testLight = new SpotLight();
  // testLight.setPerspective(70, 1.0, 0.1, 10.0);
  testLight.setOrthographic(-10.0, 10.0, 10.0, -10.0, 0.0, 10.0);

  vec3.set(testLight.position, 0, 5.0, 0);
  lookAlongQuat(testLight.orientation, [0, -0.4, 0.76], vec3Up);
  lights.push(testLight);

  const ico = new IcosphereDrawer(api);
  await ico.initialize();

  const loop = async (): Promise<void> => {
    const elapsed = (Date.now() - startTime) / 1000.0;

    // vec3.set(camera.position, 0, 0.3, Math.sin(elapsed * 0.1) * 5 + 6);

    quat.setAxisAngle(dingusMesh.orientation, vec3Up, -elapsed);

    await meshStage.draw(camera, scene, { elapsed });

    await ico.draw([0, 0, 0], dingusMesh.orientation, 1, camera);

    await meshDeferredLightingState.draw(
      camera,
      lights,
      scene,
      meshStage.getOutputs()
    );

    await outputStage.draw({
      colorTexture: meshStage.getOutputs().color,
      distanceTexture: meshStageOutputs.distance,
    });

    await handleResizing(false);

    // checkGLError(gl);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    requestAnimationFrame(loop);
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  requestAnimationFrame(loop);
}

void initWebGL2();
