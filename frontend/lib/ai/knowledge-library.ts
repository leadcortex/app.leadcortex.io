// frontend/lib/ai/knowledge-library.ts

export type KnowledgeFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  updatedAt: number;
  content: string;
};

export type KnowledgeFileSummary = Omit<KnowledgeFile, "content">;
type KnowledgeContent = Pick<KnowledgeFile, "id" | "content">;

export const KNOWLEDGE_FILE_ACCEPT =
  ".txt,.csv,.tsv,.md,.json,.yaml,.yml,.xml,.log,.js,.ts,.tsx,.jsx,.css,.html,.py,.go,.sql,.sh,.properties,.toml,.vue";

export const MAX_KNOWLEDGE_FILE_BYTES = 1024 * 1024;
const MAX_KNOWLEDGE_FILES = 80;
const MAX_CONTEXT_CHARS = 40_000;
const LEGACY_INSTRUCTIONS_KEY = "lc.ai.team.systemPrompt";
const DATABASE_NAME = "lc.ai.knowledge-library";
const DATABASE_VERSION = 2;
const STORE_NAME = "files";
const CONTENT_STORE_NAME = "contents";

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("Le stockage local de la bibliothèque n'est pas disponible."));
  }
  if (databasePromise) return databasePromise;

  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(CONTENT_STORE_NAME)) {
        const contentStore = database.createObjectStore(CONTENT_STORE_NAME, { keyPath: "id" });
        if ((event as IDBVersionChangeEvent).oldVersion < 2) {
          const fileStore = request.transaction!.objectStore(STORE_NAME);
          const cursorRequest = fileStore.openCursor();
          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (!cursor) return;
            const { content, ...summary } = cursor.value as KnowledgeFile;
            if (typeof content === "string") {
              contentStore.put({ id: summary.id, content } satisfies KnowledgeContent);
            }
            cursor.update(summary);
            cursor.continue();
          };
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Impossible d'ouvrir la bibliothèque."));
    request.onblocked = () => reject(new Error("La bibliothèque est bloquée par un autre onglet."));
  });
  const cached = opening.catch((error: unknown) => {
    databasePromise = null;
    throw error;
  });
  databasePromise = cached;
  return cached;
}

function supportedExtension(name: string) {
  return KNOWLEDGE_FILE_ACCEPT.split(",").some((ext) => name.toLowerCase().endsWith(ext));
}

export async function saveKnowledgeFile(file: File): Promise<KnowledgeFileSummary> {
  if (!supportedExtension(file.name)) {
    throw new Error(
      "Utilisez un fichier texte : TXT, CSV, TSV, MD, JSON, YAML, XML, LOG ou un fichier de code.",
    );
  }
  if (file.size > MAX_KNOWLEDGE_FILE_BYTES) {
    throw new Error("Chaque fichier de la bibliothèque doit faire 1 Mo maximum.");
  }

  const content = await file.text();
  if (content.includes("\u0000")) {
    throw new Error("Ce fichier ne semble pas être un fichier texte lisible.");
  }

  const database = await openDatabase();
  const summary: KnowledgeFileSummary = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    name: file.name,
    size: file.size,
    type: file.type || "text/plain",
    updatedAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME, CONTENT_STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    let limitError: Error | null = null;
    const countRequest = store.count();
    countRequest.onsuccess = () => {
      if (countRequest.result >= MAX_KNOWLEDGE_FILES) {
        limitError = new Error(`La bibliothèque est limitée à ${MAX_KNOWLEDGE_FILES} fichiers.`);
        transaction.abort();
        return;
      }
      store.put(summary);
      transaction
        .objectStore(CONTENT_STORE_NAME)
        .put({ id: summary.id, content } satisfies KnowledgeContent);
    };
    countRequest.onerror = () => transaction.abort();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        limitError ?? transaction.error ?? new Error(`Impossible d'enregistrer « ${file.name} ».`),
      );
    transaction.onabort = () =>
      reject(
        limitError ??
          countRequest.error ??
          transaction.error ??
          new Error(`Enregistrement annulé pour « ${file.name} ».`),
      );
  });
  return summary;
}

export async function listKnowledgeFiles(): Promise<KnowledgeFileSummary[]> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const request = transaction.objectStore(STORE_NAME).getAll() as IDBRequest<
    KnowledgeFileSummary[]
  >;
  const files = await new Promise<KnowledgeFileSummary[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Impossible de lire la bibliothèque."));
  });
  return files.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteKnowledgeFile(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction([STORE_NAME, CONTENT_STORE_NAME], "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
  transaction.objectStore(CONTENT_STORE_NAME).delete(id);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Impossible de supprimer ce fichier."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Suppression annulée."));
  });
}

export async function loadAssistantKnowledgeContext(): Promise<string> {
  let legacyInstructions = "";
  try {
    legacyInstructions = window.localStorage.getItem(LEGACY_INSTRUCTIONS_KEY) ?? "";
  } catch (error) {
    throw new Error("Impossible de lire les anciennes instructions permanentes.", {
      cause: error,
    });
  }

  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const request = transaction.objectStore(STORE_NAME).getAll() as IDBRequest<
    KnowledgeFileSummary[]
  >;
  const files = await new Promise<KnowledgeFileSummary[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Impossible de charger les fichiers de la bibliothèque."));
  });

  const sections: string[] = [];
  let remaining = MAX_CONTEXT_CHARS;
  const instructions = legacyInstructions.trim();
  if (instructions) {
    const text = instructions.slice(0, remaining);
    sections.push(`Instructions permanentes:\n${text}`);
    remaining -= text.length;
  }

  for (const file of files.sort((a, b) => b.updatedAt - a.updatedAt)) {
    if (remaining <= 0) break;
    const contentTransaction = database.transaction(CONTENT_STORE_NAME, "readonly");
    const contentRequest = contentTransaction
      .objectStore(CONTENT_STORE_NAME)
      .get(file.id) as IDBRequest<KnowledgeContent | undefined>;
    const storedContent = await new Promise<KnowledgeContent | undefined>((resolve, reject) => {
      contentRequest.onsuccess = () => resolve(contentRequest.result);
      contentRequest.onerror = () =>
        reject(contentRequest.error ?? new Error(`Impossible de charger « ${file.name} ».`));
    });
    const content = storedContent?.content.trim() ?? "";
    if (!content) continue;
    const section = `Fichier de référence « ${file.name} »:\n${content}`;
    const text = section.slice(0, remaining);
    sections.push(text);
    remaining -= text.length;
  }

  return sections.join("\n\n");
}
