import { generateIcoSphere } from "./util/generateIcoSphere.ts";

void generateIcoSphere({
  name: "test",
  outDir: "generationtest/test-model",
  levels: 4,
  heightMap: "",
  heightScale: 1.0,
  radius: 6378 * 1000,
});
