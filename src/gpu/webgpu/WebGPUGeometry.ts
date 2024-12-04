import { Geometry } from "../GPUApiInterface.ts";
import { WebGPUApiImplementation } from "./WebGPUApiImplementation.ts";
import { WebGPUImmediateContext } from "./WebGPUImmediateContext.ts";

interface WebGPUGeometryCreateResult {
  verticesBuffer: GPUBuffer;
  vertexCount: number;
}

function createGeometry(
  device: GPUDevice,
  data: Float32Array
): WebGPUGeometryCreateResult {
  if (data.length % 12 !== 0) {
    throw new Error("invalid vertex data");
  }
  const verticesBuffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(verticesBuffer.getMappedRange()).set(data);
  verticesBuffer.unmap();
  return {
    verticesBuffer,
    vertexCount: data.length / 12,
  };
}

export class WebGPUGeometry implements Geometry {
  private createdGeometry: WebGPUGeometryCreateResult | null;

  public constructor(
    gpu: WebGPUApiImplementation,
    private readonly currentDrawingContext: WebGPUImmediateContext,
    data: Float32Array
  ) {
    this.createdGeometry = createGeometry(gpu.device, data);
  }

  public draw(): void {
    if (
      this.createdGeometry &&
      this.currentDrawingContext.renderPassEncoder &&
      this.currentDrawingContext.uniformBindGroup
    ) {
      this.currentDrawingContext.renderPassEncoder.setBindGroup(
        0,
        this.currentDrawingContext.uniformBindGroup
      );
      this.currentDrawingContext.renderPassEncoder.setVertexBuffer(
        0,
        this.createdGeometry.verticesBuffer
      );
      this.currentDrawingContext.renderPassEncoder.draw(
        this.createdGeometry.vertexCount
      );
    } else {
      throw new Error("Draw after free");
    }
  }

  public free(): void {
    if (this.createdGeometry) {
      this.createdGeometry.verticesBuffer.destroy();
    }
    this.createdGeometry = null;
  }
}
