async function resolveIncludes(
  fileName: string,
  contentsRaw: string,
  counter = 10
): Promise<string> {
  const contents = contentsRaw.replaceAll("\r\n", "\n").split("\n");
  if (!contents[0].startsWith("#version")) {
    contents.unshift(`#line 1 ${counter.toString()}`);
  }

  const header = "#include ";
  const guard = "#pragma once";
  let encloseInGuard = false;
  for (let i = 0; i < contents.length; i++) {
    if (contents[i].startsWith(header)) {
      const include = contents[i].substring(header.length).replaceAll('"', "");
      const includeContents = await loadAndResolveShaderSource(
        include,
        counter + 10
      );
      contents[i] =
        includeContents +
        `\n#line ${(i + (encloseInGuard ? 3 : 2)).toString()} ${counter.toString()}`;
    } else if (contents[i].includes(guard)) {
      contents[i] = "";
      encloseInGuard = true;
    }
  }
  let result = contents.join("\n");
  if (encloseInGuard) {
    const guid = "X" + fileName.replaceAll(/[^A-z0-9]/g, "_");
    result =
      "#ifndef " + guid + "\n#define " + guid + "\n" + result + "\n#endif";
  }
  console.log(result);
  return result;
}

export async function loadAndResolveShaderSource(
  file: string,
  fileIdent = 0
): Promise<string> {
  const response = await fetch(file);
  if (!response.ok) {
    throw new Error(`Failed loading shader ${file}, request not ok`);
  }
  if (response.headers.get("Content-type") === "text/html") {
    throw new Error(`Failed loading shader ${file}, got html`);
  }
  const contents = await response.text();
  return resolveIncludes(file, contents, fileIdent);
}
