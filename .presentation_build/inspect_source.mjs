import { FileBlob, PresentationFile } from "@oai/artifact-tool";
import fs from "node:fs/promises";

const source = "C:/Users/Elmerk/Desktop/Escritorio/CARPETAS/Trabajo final/Img proyecto/GYMManager_Presentacion.pptx";
const presentation = await PresentationFile.importPptx(await FileBlob.load(source));
const inspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,table,chart,notes,layout",
  maxChars: 12000,
});
console.log(inspection.ndjson);
const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile("source-montage.webp", new Uint8Array(await montage.arrayBuffer()));
for (const index of [0, 2, 6, 7, 8, 9, 10, 11, 12, 13]) {
  const slide = presentation.slides.getItem(index);
  const preview = await slide.export({ format: "png", scale: 1 });
  await fs.writeFile(`source-slide-${index + 1}.png`, new Uint8Array(await preview.arrayBuffer()));
}
