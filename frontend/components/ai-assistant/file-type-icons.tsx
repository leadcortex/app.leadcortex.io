// frontend/components/ai-assistant/file-type-icons.tsx

export type FileKind =
  | "pdf"
  | "doc"
  | "xls"
  | "ppt"
  | "csv"
  | "txt"
  | "zip"
  | "code"
  | "image"
  | "context"
  | "adobe"
  | "3d"
  | "audio"
  | "video"
  | "folder"
  | "download"
  | "default";

const OFFICE_ICONS: Record<string, string> = {
  pdf: "office/pdf.svg",
  doc: "office/doc.svg",
  docx: "office/docx.svg",
  odt: "office/doc.svg",
  pages: "office/doc.svg",
  rtf: "office/rtf.svg",
  xls: "office/xls.svg",
  xlsx: "office/xlsx.svg",
  csv: "office/csv.svg",
  ods: "office/ods.svg",
  numbers: "office/xls.svg",
  tsv: "office/csv.svg",
  ppt: "office/ppt.svg",
  pptx: "office/pptx.svg",
  odp: "office/odp.svg",
  key: "office/ppt.svg",
  txt: "office/txt.svg",
  log: "office/txt.svg",
};

const ADOBE_ICONS: Record<string, string> = {
  ai: "adobe/ai.svg",
  eps: "adobe/eps.svg",
  indd: "adobe/indd.svg",
  idml: "adobe/idml.svg",
  psd: "adobe/psd.svg",
  psb: "adobe/psb.svg",
  aep: "adobe/aep.svg",
  aepx: "adobe/aepx.svg",
  prproj: "adobe/prprpoj.svg",
  pproj: "adobe/pproj.svg",
  lrcat: "adobe/lrcat.svg",
  xmp: "adobe/xmp.svg",
  sesx: "adobe/sesx.svg",
  pkf: "adobe/pkf.svg",
  fla: "adobe/fla.svg",
  xfl: "adobe/xfl.svg",
};

const GENERIC_ADOBE_EXTENSIONS = [
  "abr",
  "aco",
  "aet",
  "ait",
  "asl",
  "atn",
  "csh",
  "grd",
  "icma",
  "icml",
  "icmt",
  "idpp",
  "indb",
  "indt",
  "mogrt",
  "pat",
  "prfpset",
  "prpreset",
  "xd",
];

const CODE_ICONS: Record<string, string> = {
  css: "css.svg",
  html: "html.svg",
  htm: "html.svg",
  js: "js.svg",
  mjs: "js.svg",
  cjs: "js.svg",
  json: "json.svg",
  ts: "ts.svg",
  md: "md.svg",
  go: "go.svg",
  yml: "yml.svg",
  yaml: "yml.svg",
  py: "py.svg",
  sql: "sql.svg",
  tsx: "tsx.svg",
  jsx: "jsx.svg",
  c: "c.svg",
  h: "c.svg",
  "c#": "c%23.svg",
  cs: "c%23.svg",
  "c++": "c%2B%2B.svg",
  cpp: "c%2B%2B.svg",
  hpp: "c%2B%2B.svg",
  java: "java.svg",
  php: "php.svg",
  rb: "rb.svg",
  rs: "rs.svg",
  swift: "swift.svg",
  kt: "kt.svg",
  vue: "vue.svg",
  sass: "sass.svg",
  scss: "sass.svg",
  sh: "sh.svg",
  bash: "bash.svg",
  env: "env.svg",
  xml: "xml.svg",
  dockerfile: "docketfile.svg",
  gitignore: "gitinore.svg",
};

const IMAGE_EXTENSIONS = [
  "avif",
  "bmp",
  "gif",
  "heic",
  "jpg",
  "jpeg",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
];
const VIDEO_EXTENSIONS = [
  "3gp",
  "avi",
  "flv",
  "m2ts",
  "m4v",
  "mkv",
  "mov",
  "mp4",
  "mpeg",
  "mpg",
  "mxf",
  "mts",
  "ogv",
  "ts",
  "vob",
  "webm",
  "wmv",
];
const AUDIO_EXTENSIONS = [
  "aac",
  "aiff",
  "amr",
  "caf",
  "flac",
  "m4a",
  "mid",
  "midi",
  "mp3",
  "oga",
  "ogg",
  "opus",
  "wav",
  "wma",
];
const MODEL_3D_EXTENSIONS = [
  "3ds",
  "3mf",
  "abc",
  "blend",
  "c4d",
  "dae",
  "fbx",
  "glb",
  "gltf",
  "iges",
  "igs",
  "ma",
  "mb",
  "max",
  "obj",
  "sldasm",
  "sldprt",
  "skp",
  "stl",
  "step",
  "stp",
  "usd",
  "usdz",
  "vrm",
  "wire",
  "x3d",
];
const TEXT_EXTENSIONS = new Set([
  ...Object.keys(CODE_ICONS),
  "txt",
  "csv",
  "tsv",
  "log",
  "properties",
  "toml",
]);

export const MAX_ASSISTANT_TEXT_FILE_BYTES = 256 * 1024;
export const MAX_ASSISTANT_FILES = 20;
export const MAX_ASSISTANT_FILE_BYTES = 500 * 1024 * 1024;
export const MAX_ASSISTANT_ZIP_BYTES = 30 * 1024 * 1024;

const CLAUDE_DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "csv",
  "txt",
  "html",
  "odt",
  "rtf",
  "epub",
  "json",
  "xlsx",
]);
const CLAUDE_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
const ARCHIVE_EXTENSIONS = new Set(["zip"]);

function extensionOf(name: string) {
  const normalized = name.trim().toLowerCase();
  if (normalized === "dockerfile" || normalized === ".gitignore") return normalized;
  return normalized.split(".").pop() ?? "";
}

export function getFileKind(name: string): FileKind {
  const ext = extensionOf(name);
  if (ext === "folder" || ext === "__folder__") return "folder";
  if (ext === "download" || ext === "__download__") return "download";
  if (ext === "3d") return "3d";
  if (ext === "audio") return "audio";
  if (ext === "video") return "video";
  if (ext === "image") return "image";
  if (ext === "code") return "code";
  if (ext === "adobe") return "adobe";
  if (OFFICE_ICONS[ext]) {
    if (["csv", "tsv"].includes(ext)) return "csv";
    if (["txt", "log"].includes(ext)) return "txt";
    if (ext === "pdf") return "pdf";
    if (["xls", "xlsx", "ods", "numbers"].includes(ext)) return "xls";
    if (["ppt", "pptx", "odp", "key"].includes(ext)) return "ppt";
    return "doc";
  }
  if (ADOBE_ICONS[ext]) return "adobe";
  if (GENERIC_ADOBE_EXTENSIONS.includes(ext)) return "adobe";
  if (MODEL_3D_EXTENSIONS.includes(ext)) return "3d";
  if (VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (AUDIO_EXTENSIONS.includes(ext)) return "audio";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (CODE_ICONS[ext] || TEXT_EXTENSIONS.has(ext)) return "code";
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)) return "zip";
  return "default";
}

export function getFileIconPath(name: string): string {
  const ext = extensionOf(name);
  if (ext === "code") return "/icons/files/code/code.svg";
  if (ext === "image") return "/icons/files/general/image.svg";
  if (ext === "context") return "/icons/files/folders/finder.svg";
  if (ext === "3d") return "/icons/files/general/3D.svg";
  if (ext === "video") return "/icons/files/general/video.svg";
  if (ext === "audio") return "/icons/files/general/audio.svg";
  if (ext === "adobe") return "/icons/files/adobe/adobe.svg";
  if (ext === "zip") return "/icons/files/folders/zip.svg";
  if (ext === "folder" || ext === "__folder__") return "/icons/files/folders/finder.svg";
  if (ext === "download" || ext === "__download__") return "/icons/files/folders/download.svg";
  if (OFFICE_ICONS[ext]) return `/icons/files/${OFFICE_ICONS[ext]}`;
  if (ADOBE_ICONS[ext]) return `/icons/files/${ADOBE_ICONS[ext]}`;
  if (GENERIC_ADOBE_EXTENSIONS.includes(ext)) {
    return "/icons/files/adobe/adobe.svg";
  }
  if (MODEL_3D_EXTENSIONS.includes(ext)) return "/icons/files/general/3D.svg";
  if (VIDEO_EXTENSIONS.includes(ext)) return "/icons/files/general/video.svg";
  if (AUDIO_EXTENSIONS.includes(ext)) return "/icons/files/general/audio.svg";
  if (IMAGE_EXTENSIONS.includes(ext)) {
    const file = ["bmp", "heic", "tif", "tiff"].includes(ext)
      ? "image"
      : ext === "jpg"
        ? "jpeg"
        : ext;
    return `/icons/files/general/${file}.svg`;
  }
  if (CODE_ICONS[ext]) return `/icons/files/code/${CODE_ICONS[ext]}`;
  if (TEXT_EXTENSIONS.has(ext)) return "/icons/files/code/code.svg";
  if (["dockerfile", "gitignore"].includes(ext)) {
    return `/icons/files/code/${CODE_ICONS[ext]}`;
  }
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)) {
    return "/icons/files/folders/zip.svg";
  }
  if (ext === "folder" || ext === "__folder__") return "/icons/files/folders/finder.svg";
  if (ext === "download" || ext === "__download__") return "/icons/files/folders/download.svg";
  return "/icons/files/folders/finder.svg";
}

export function getAttachmentReadability(
  name: string,
  size: number,
  fileAvailable = true,
): { readable: boolean; reason?: string } {
  const ext = extensionOf(name);
  if (!fileAvailable) {
    return { readable: false, reason: "fichier invalide" };
  }
  if (ARCHIVE_EXTENSIONS.has(ext)) {
    return size > MAX_ASSISTANT_ZIP_BYTES
      ? { readable: false, reason: "poids trop élevé (limite ZIP : 30 Mo)" }
      : { readable: true };
  }
  if (
    size > MAX_ASSISTANT_FILE_BYTES
  ) {
    return { readable: false, reason: "poids trop élevé (limite : 500 Mo)" };
  }
  if (
    CLAUDE_DOCUMENT_EXTENSIONS.has(ext) ||
    CLAUDE_IMAGE_EXTENSIONS.has(ext) ||
    TEXT_EXTENSIONS.has(ext)
  ) {
    return { readable: true };
  }
  return { readable: false, reason: "fichier invalide" };
}

export function isTextAttachment(name: string): boolean {
  const ext = extensionOf(name);
  return TEXT_EXTENSIONS.has(ext) || ["html", "epub", "rtf"].includes(ext);
}

export function FileKindIcon({
  kind,
  name,
  size = 20,
  className,
}: {
  kind: FileKind;
  name?: string;
  size?: number;
  className?: string;
}) {
  const path = getFileIconPath(name ?? kind);

  return (
    <img
      src={path}
      width={size}
      height={size}
      className={className}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
    />
  );
}
