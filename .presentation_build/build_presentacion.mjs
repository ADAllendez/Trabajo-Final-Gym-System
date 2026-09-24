import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const SKILL_DIR = "C:/Users/Elmerk/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.12148/skills/presentations";
const workspaceDir = "C:/Users/Elmerk/Desktop/Escritorio/CARPETAS/Development/gym-system";
const sourcePath = "C:/Users/Elmerk/Desktop/Escritorio/CARPETAS/Trabajo final/Img proyecto/GYMManager_Presentacion.pptx";
const assetsDir = "C:/Users/Elmerk/Desktop/Escritorio/CARPETAS/Trabajo final/Img proyecto";
const buildDir = path.join(workspaceDir, ".presentation_build");
const finalDir = path.join(workspaceDir, "presentacion_final");
const candidatePath = path.join(buildDir, "GYM_Manager_Defensa_candidato.pptx");
const finalPath = path.join(finalDir, "GYM_Manager_Defensa_Final.pptx");
const pythonExecutable = "C:/Users/Elmerk/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";

await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(finalDir, { recursive: true });
await fs.rm(finalPath, { force: true });

const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));
const setText = (id, value) => { presentation.resolve(id).text = value; };
const setNotes = (slideId, value) => { presentation.resolve(slideId).speakerNotes.textFrame.setText(value); };

// Datos técnicos verificados contra la configuración actual del proyecto.
setText("sh/jadsz2xk", "Motor relacional configurado mediante DATABASE_URL");
setText("sh/2xkrih8b", "Mapeo objeto-relacional asíncrono para MySQL");
setText("sh/hgrmpwj2", "MySQL + aiomysql ✓");
setText("sh/pkr6tgjy", "6-8 semanas estimadas");
setText("sh/3i94r61s", "~8 semanas de desarrollo efectivo");
setText("sh/lsj6t47m", "Roles root, admin y empleado con JWT");
setNotes("sl/jyx0ra1s", "El backend utiliza FastAPI, SQLAlchemy y MySQL con aiomysql. El frontend usa React, React Router y Tailwind CSS. GitHub mantiene el historial de cambios.");
setNotes("sl/i107q5of", "El cambio tecnológico principal fue pasar de Node.js y Express a Python y FastAPI. La implementación actual usa MySQL como base de datos y aiomysql para la conexión asíncrona.");

// Login: evidencia visual real y aclaración de roles.
setText("sh/18byd4zy", "Inicio de sesión y autenticación");
setText("sh/ehgvihwr", "root, admin y empleado");
setText("sh/lgbepgvm", "JWT para acceder a rutas protegidas");
const loginSlide = presentation.resolve("sl/fu1gfa1s");
const loginBytes = await fs.readFile(path.join(assetsDir, "Login.png"));
loginSlide.images.add({
  blob: loginBytes,
  contentType: "image/png",
  alt: "Pantalla de inicio de sesión de GYM Manager",
  fit: "cover",
  crop: { left: 0.26, top: 0.20, right: 0.26, bottom: 0.20 },
  geometry: "roundRect",
  borderRadius: "rounded-xl",
  position: { left: 336, top: 128, width: 288, height: 230 },
});
setNotes("sl/fu1gfa1s", "La aplicación solicita usuario y contraseña. Tras validar las credenciales, el backend entrega un JWT. Los roles root, admin y empleado determinan los permisos disponibles.");

// Sustituir con las capturas proporcionadas por el usuario.
const dashboardBytes = await fs.readFile(path.join(assetsDir, "Dashboard.png"));
const dashboardImage = presentation.resolve("im/6tknud0f");
dashboardImage.replace({ blob: dashboardBytes, contentType: "image/png", alt: "Dashboard de GYM Manager", fit: "cover" });
setText("sh/cza94vmx", "Dashboard");
setText("sh/d0jax03i", "Resumen operativo del gimnasio en una sola pantalla");
setNotes("sl/ofy9wn61", "El Dashboard reúne indicadores de miembros, membresías activas y vencidas, nuevos ingresos, disciplinas e instructores. Es la primera pantalla útil para conocer el estado del gimnasio.");

const vencidosBytes = await fs.readFile(path.join(assetsDir, "Vencidos.png"));
const vencidosImage = presentation.resolve("im/cre5or2h");
vencidosImage.replace({ blob: vencidosBytes, contentType: "image/png", alt: "Módulo de vencidos de GYM Manager", fit: "cover" });

// El recorrido funcional empieza con Login y continúa con los módulos en orden.
setText("sh/cb2tkvap", "Recorrido funcional del sistema");
setNotes("sl/gnmp4jqx", "Primero mostramos el acceso al sistema. Luego recorremos Dashboard, Miembros, Membresías, Vencidos, Disciplinas, Instructores y Trabajadores, y Finanzas.");
const dashboardSlide = presentation.resolve("sl/ofy9wn61");
dashboardSlide.moveTo(7);

// Ajustar la nota del cierre para guiar el final de la defensa.
const finalSlide = presentation.slides.getItem(19);
finalSlide.speakerNotes.textFrame.setText("Cierre: GYM Manager reemplaza el registro manual del gimnasio con una aplicación web que concentra socios, membresías, vencimientos, personal y finanzas. Agradecer y abrir preguntas.");

await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const { finalizePresentation } = await import(pathToFileURL(
  path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs"),
).href);
const result = await finalizePresentation({
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "9144000,5143500", "--validate-bullet-geometry", "--validate-heading-fit"],
  sourceTemplatePath: sourcePath,
  requiredNativeTableOwnerSlides: [],
  fontPolicy: undefined,
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, "GYM_Manager_Defensa_Final.validation.json"),
});
console.log(JSON.stringify({ finalPath, result }, null, 2));
