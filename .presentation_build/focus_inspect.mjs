import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const source = "C:/Users/Elmerk/Desktop/Escritorio/CARPETAS/Trabajo final/Img proyecto/GYMManager_Presentacion.pptx";
const presentation = await PresentationFile.importPptx(await FileBlob.load(source));
for (const search of ["Acceso seguro", "Roles", "root", "Auto", "Usuario root", "9 módulos", "La solución", "Módulo: Vencidos"]) {
  const result = await presentation.inspect({ kind: "slide,textbox,shape,image,notes", search, maxChars: 4000 });
  console.log(`SEARCH ${search}`);
  console.log(result.ndjson);
}
const vencidos = await presentation.inspect({ kind: "slide,textbox,shape,image,notes", target: { id: "sl/jetc3ut0", beforeLines: 0, afterLines: 30 }, maxChars: 10000 });
console.log("VENCIDOS DETAIL");
console.log(vencidos.ndjson);
for (const id of ["sl/jyx0ra1s", "sl/i107q5of", "sl/gnmp4jqx"]) {
  const detail = await presentation.inspect({ kind: "slide,textbox,shape,image,notes", target: { id, beforeLines: 0, afterLines: 50 }, maxChars: 16000 });
  console.log(`DETAIL ${id}`);
  console.log(detail.ndjson);
}
