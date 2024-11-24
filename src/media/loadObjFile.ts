import { Object3dIntermediate, Vertex } from "./Object3dIntermediate.ts";

class Vector2 {
  public constructor(
    public x: number,
    public y: number
  ) {}
}

class Vector3 {
  public constructor(
    public x: number,
    public y: number,
    public z: number
  ) {}
}

interface VertexInfo {
  position: Vector3;
  uv: Vector2;
  normal: Vector3;
}

interface ObjFileData {
  name: string;
  materialName: string;
  intermediate: Object3dIntermediate;
}

function extractGroup(
  match: RegExpExecArray | null,
  group: number,
  def: string
): string {
  if (!match) return def;
  if (!match[group]) return def;
  return match[group];
}

export function loadObjFileAsSingleMesh(contents: string): ObjFileData {
  const lines = contents
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((x) => x.trim());
  const tempVertices = new Array<Vector3>();
  const tempNormals = new Array<Vector3>();
  const tempUvs = new Array<Vector2>();
  const outVertexBuffer = new Array<VertexInfo>();

  let match: RegExpExecArray | null = null;
  for (const line of lines) {
    if (line.startsWith("vt")) {
      match = new RegExp("vt ([0-9.-]+) ([0-9.-]+)").exec(line);
      tempUvs.push(
        new Vector2(
          parseFloat(extractGroup(match, 1, "0")),
          parseFloat(extractGroup(match, 2, "0"))
        )
      );
    } else if (line.startsWith("vn")) {
      match = new RegExp("vn ([0-9.-]+) ([0-9.-]+) ([0-9.-]+)").exec(line);
      tempNormals.push(
        new Vector3(
          parseFloat(extractGroup(match, 1, "0")),
          parseFloat(extractGroup(match, 2, "0")),
          parseFloat(extractGroup(match, 3, "0"))
        )
      );
    } else if (line.startsWith("v")) {
      match = new RegExp("v ([0-9.-]+) ([0-9.-]+) ([0-9.-]+)").exec(line);
      tempVertices.push(
        new Vector3(
          parseFloat(extractGroup(match, 1, "0")),
          parseFloat(extractGroup(match, 2, "0")),
          parseFloat(extractGroup(match, 3, "0"))
        )
      );
    } else if (line.startsWith("f")) {
      match = new RegExp(
        "f ([0-9]+)/([0-9]+)/([0-9]+) ([0-9]+)/([0-9]+)/([0-9]+) ([0-9]+)/([0-9]+)/([0-9]+)"
      ).exec(line);
      if (match) {
        for (let i = 1; ; ) {
          const vertex =
            tempVertices[parseInt(extractGroup(match, i++, "0")) - 1];
          const uv = tempUvs[parseInt(extractGroup(match, i++, "0")) - 1];
          const normal =
            tempNormals[parseInt(extractGroup(match, i++, "0")) - 1];

          outVertexBuffer.push({ position: vertex, normal: normal, uv: uv });
          if (i >= 9) break;
        }
      } else {
        match = new RegExp(
          "f ([0-9]+)//([0-9]+) ([0-9]+)//([0-9]+) ([0-9]+)//([0-9]+)"
        ).exec(line);
        if (match) {
          for (let i = 1; ; ) {
            const vertex =
              tempVertices[parseInt(extractGroup(match, i++, "0")) - 1];
            const normal =
              tempNormals[parseInt(extractGroup(match, i++, "0")) - 1];

            outVertexBuffer.push({
              position: vertex,
              normal: normal,
              uv: { x: normal.x, y: normal.y },
            });
            if (i >= 6) break;
          }
        }
      }
    }
  }
  return {
    intermediate: new Object3dIntermediate(
      vertexInfoArrayToVertexArray(outVertexBuffer)
    ),
    name: extractGroup(match, 1, "No name"),
    materialName: "None",
  };
}

const vertexInfoArrayToVertexArray = (data: VertexInfo[]): Vertex[] => {
  return data.map(
    (d) =>
      new Vertex(
        [d.position.x, d.position.y, d.position.z],
        [d.uv.x, d.uv.y],
        [d.normal.x, d.normal.y, d.normal.z],
        [0.0, 0.0, 0.0, 0.0]
      )
  );
};
