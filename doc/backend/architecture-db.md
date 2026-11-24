# 🗺️ Guide Ultimate Backend & Base de Données Personnalisée (Zero-Ransom)

> **Projet** : Plateforme de Prospection SaaS & Académie  
> **Objectif** : Remplacer Supabase par une architecture 100% autonome, évolutive, zéro coût caché, capable d'absorber des millions de prospects et de comptes sans subir de hausse de tarif imprévue.  
> **Utilisation** : Ce document est à la fois votre **Feuille de route personnelle (Checklist/QCM)** et la **Consigne Technique Unique** à donner à votre IA développeur pour coder le backend.

---

## 📑 TABLE DES MATIÈRES
1. [PARTIE 1 : QCM & Checklist de Préparation (Pour Vous)](#partie-1--qcm--checklist-de-préparation-pour-vous)
2. [PARTIE 2 : Architecture Technologique & Vision Globale](#partie-2--architecture-technologique--vision-globale)
3. [PARTIE 3 : Base de Données Relationnelle & Massives (PostgreSQL + Drizzle)](#partie-3--base-de-données-relationnelle--massives-postgresql--drizzle)
4. [PARTIE 4 : Authentification Auto-Hébergée (Better Auth)](#partie-4--authentification-auto-hébergée-better-auth)
5. [PARTIE 5 : Files d'Attente & Tâches de Fond (Redis + BullMQ)](#partie-5--files-dattente--tâches-de-fond-redis--bullmq)
6. [PARTIE 6 : Stockage Fichiers Lourds & Exports (Cloudflare R2 / S3)](#partie-6--stockage-fichiers-lourds--exports-cloudflare-r2--s3)
7. [PARTIE 7 : Module Indépendant - Backend Académie](#partie-7--module-indépendant---backend-académie)
8. [PARTIE 8 : Consignes Strictes pour l'IA Développeur](#partie-8--consignes-strictes-pour-lia-développeur)

---

## 🛠️ PARTIE 1 : QCM & CHECKLIST DE PRÉPARATION (POUR VOUS)

Cochez et remplissez les cases directement dans ce fichier `.md` au fur et à mesure que vous avancez. Cela permettra à votre IA développeur de savoir exactement ce qui est déjà prêt sur votre ordinateur.

### 1.1 Extensions VS Code à installer
Allez dans l'onglet **Extensions** (`Ctrl+Shift+X` ou `Cmd+Shift+X`) dans VS Code et installez les extensions suivantes :

- [j'ai insaller PostgreSQL via les extention vs code (a voir si il n'y a pas de probleme) ] **Database Client** (par *cweijan*) ou **PostgreSQL** (par *Chris Kolkman*) : Pour voir vos tables SQL directement dans VS Code.
- [c'est insaler mais ma vertion de vs code et en français donc c'est conteneur] **Docker** (par *Microsoft*) : Pour gérer votre base de données locale en 1 clic.
- [les deux son instaler] **Drizzle ORM / Prisma** : Pour la coloration syntaxique des fichiers de base de données.
- [les deux aussi] **REST Client** ou **Thunder Client** : Pour tester vos API sans sortir de VS Code.

> ✏️ **Validation utilisateur** :  
> *Écrivez `[OK]` ici une fois les extensions installées* : `[ c'est insaler mais je veux des commende pour verifer que se sera reconnue]`

---

### 1.2 Outils Système à Vérifier (Terminal)
Ouvrez le terminal de VS Code (`Ctrl+~` ou `Cmd+~`) et tapez les commandes ci-dessous pour tester votre ordinateur.

#### Étape A : Vérifier Node.js / Bun
```bash
node -v
# ou si vous utilisez Bun :
bun -v
```
> ✏️ *Notez la version affichée* : $ node -v
v24.19.0 
> Statut : [c'est bon ] Validé

#### Étape B : Vérifier Docker & Docker Compose
```bash
docker --version
docker compose version
```
> ✏️ *Notez les versions affichées* : $ docker --version
docker compose version
Docker version 29.9.1, build dfc520d
Docker Compose version v5.6.0
 
> Statut : [ ] Validé

#### Étape C : Installer Drizzle Kit (Outil de migration SQL)
```bash
npm install -g drizzle-kit
# ou : bun add -g drizzle-kit
```
> Statut : [$ npm install -g drizzle-kit
npm warn deprecated @esbuild-kit/core-utils@3.3.2: Merged into tsx: https://tsx.hirok.io
npm warn deprecated @esbuild-kit/esm-loader@2.6.5: Merged into tsx: https://tsx.hirok.io

added 16 packages in 24s

2 packages are looking for funding
  run `npm fund` for details
npm warn allow-scripts 3 packages have install scripts not yet covered by allowScripts:
npm warn allow-scripts   esbuild@0.25.12 (postinstall: node install.js)
npm warn allow-scripts   esbuild@0.18.20 (postinstall: node install.js)
npm warn allow-scripts   esbuild@0.28.2 (postinstall: node install.js)
npm warn allow-scripts
npm warn allow-scripts Run `npm install -g --allow-scripts=esbuild,esbuild,esbuild` to allow these scripts once, or `npm config set allow-scripts=esbuild,esbuild,esbuild --location=user` to allow them for all global installs.] Validé

---

## 🏗️ PARTIE 2 : ARCHITECTURE TECHNOLOGIQUE & VISION GLOBALE

Cette infrastructure remplace intégralement Supabase. Tous les composants sont **open-source**, **libres de droits**, et peuvent être hébergés gratuitement au début (Docker local, Render, Neon, Fly.io, Oracle Free Tier) puis migrés sur un VPS (Hetzner, DigitalOcean) pour moins de 10€/mois quand vous aurez des milliers de clients.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             FRONTEND (Next.js / Vite)                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│     BETTER AUTH       │  │      DRIZZLE ORM      │  │     BULLMQ / REDIS    │
│ (Sessions & Comptes)  │  │ (Requêtes Postgres)   │  │ (Scraping & Relances) │
└───────────┬───────────┘  └───────────┬───────────┘  └───────────┬───────────┘
            │                          │                          │
            ▼                          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL + JSONB (Base Principale)                   │
│         (Utilisateurs, Abonnements, Prospects, Données Enrichies)           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
                          ┌──────────────────────────┐
                          │      CLOUDFLARE R2       │
                          │  (CSV, Avatars, PDF)     │
                          └──────────────────────────┘
```

---

## 🗄️ PARTIE 3 : BASE DE DONNÉES RELATIONNELLE & MASSIVES (PostgreSQL + Drizzle)

PostgreSQL gère les données structurées. Pour les données de prospection très changeantes (enrichissement web, technos, signaux d'achat), nous utilisons le type **JSONB** (NoSQL intégré dans Postgres) pour ne pas dégrader les performances.

### 3.1 Fichier Docker Compose Local (`docker-compose.yml`)
*À exécuter sur votre machine pour démarrer Postgres & Redis en 1 seconde.*

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: custom_postgres_db
    restart: always
    environment:
      POSTGRES_USER: app_admin
      POSTGRES_PASSWORD: super_secure_password_123
      POSTGRES_DB: main_prospect_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: custom_redis_queue
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

> **Commandes Terminal utiles** :
> - Lancer la DB : `docker compose up -d`
> - Arrêter la DB : `docker compose down`

---

### 3.2 Schéma Drizzle ORM (`src/db/schema.ts`)

Dans ce dépôt, le schéma Drizzle est centralisé dans `src/server/db/auth-schema.ts`. Les utilisateurs ont déjà un identifiant UUID ; la table `prospects` reprend ce type pour `user_id`, stocke les données d'enrichissement en JSONB et ajoute les index utilisateur/e-mail. La migration correspondante a été générée dans `drizzle/0002_add_prospects.sql`. Pour l'appliquer à la base configurée, vérifiez d'abord `DATABASE_URL`, puis lancez `npm run db:migrate`.

```typescript
import { pgTable, text, timestamp, boolean, jsonb, uuid, index } from 'drizzle-orm/pg-core';

// --- TABLE UTILISATEURS (Gérée avec Better Auth) ---
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  plan: text('plan').default('free').notNull(), // 'free', 'pro', 'enterprise'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- TABLE SESSIONS ---
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- TABLE PROSPECTS (HAUTE DENSITÉ DE DONNÉES) ---
export const prospects = pgTable('prospects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  companyName: text('company_name'),
  status: text('status').default('raw').notNull(), // 'raw', 'enriching', 'enriched', 'contacted'
  
  // Stockage NoSQL hybride (JSONB) pour des millions de métadonnées sans ralentir SQL
  enrichmentData: jsonb('enrichment_data').$type<{
    linkedinUrl?: string;
    phone?: string;
    technologies?: string[];
    companySize?: string;
    customAttributes?: Record<string, unknown>;
  }>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Indexation ultra-rapide pour des requêtes instantanées
  userIdIdx: index('prospects_user_id_idx').on(table.userId),
  emailIdx: index('prospects_email_idx').on(table.email),
}));
```

---

## 🔐 PARTIE 4 : AUTHENTIFICATION AUTO-HÉBERGÉE (Better Auth)

Better Auth s'installe directement dans votre backend Node.js/Bun. Pas de quota d'utilisateurs, pas d'abonnement mensuel.

### Configuration (`src/lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db"; // Votre instance Drizzle

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // Session valide 7 jours
        updateAge: 60 * 60 * 24, // Rafraîchie chaque jour
    },
});
```

---

## ⚡ PARTIE 5 : FILES D'ATTENTE & TÂCHES DE FOND (Redis + BullMQ)

Pour éviter que votre serveur ne plante quand un utilisateur lance la prospection de 5 000 emails en même temps.

### 5.1 Fichier de File d'Attente (`src/queues/enrichment.queue.ts`)

```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Queue pour ajouter des tâches
export const enrichmentQueue = new Queue('enrichment-queue', { connection });

// Worker qui s'exécute séparément sans bloquer votre site web
export const enrichmentWorker = new Worker('enrichment-queue', async (job) => {
    const { prospectId, domain } = job.data;
    console.log(`[JOB ${job.id}] Traitement du prospect : ${prospectId}`);
    
    // 1. Scraping / Enrichissement d'email
    // 2. Sauvegarde automatique dans le champ JSONB de PostgreSQL
}, { 
    connection,
    concurrency: 5 // Traite 5 prospects simultanément
});
```

---

## 📁 PARTIE 6 : STOCKAGE FICHIERS LOURDS & EXPORTS (Cloudflare R2 / S3)

Ne stockez **jamais** de fichiers CSV, PDF ou images dans PostgreSQL. Utilisez Cloudflare R2 (10 Go gratuits, 0 € de transfert).

### Client de Stockage (`src/lib/storage.ts`)

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadExportCSV(filename: string, content: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `exports/${filename}`,
    Body: content,
    ContentType: "text/csv",
  });
  return await r2Client.send(command);
}
```

---

## 🎓 PARTIE 7 : MODULE INDÉPENDANT - BACKEND ACADÉMIE

L'Académie (cours, vidéos, quiz, progression) doit être gérée comme un **module séparé** ("App dans l'App") pour ne pas ralentir le moteur de prospection principal.

### Stratégie d'Architecture :
1. **Tables Dédiées en Base de Données** : Utilisez le même serveur PostgreSQL mais isolez les tables avec le préfixe `academy_`.
2. **Sortie Différée** : Comme l'Académie sortira plus tard, ces tables n'impactent pas la V1.
3. **Alternative Go / Node** : Vous pouvez conserver l'existant en Go sous forme de microservice ultra-rapide, ou tout centraliser dans l'API principale Node/Bun avec un préfixe de route `/api/v1/academy`.

#### Schéma SQL de l'Académie (`src/db/schema-academy.ts`)

```typescript
import { pgTable, text, timestamp, integer, boolean, uuid } from 'drizzle-orm/pg-core';
import { users } from './schema';

export const academyCourses = pgTable('academy_courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const academyLessons = pgTable('academy_lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').references(() => academyCourses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  videoUrl: text('video_url'), // Stocké sur Cloudflare R2 ou Stream
  order: integer('order').notNull(),
});

export const academyUserProgress = pgTable('academy_user_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').references(() => academyLessons.id, { onDelete: 'cascade' }),
  completed: boolean('completed').default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## 🤖 PARTIE 8 : CONSIGNES STRICTES POUR L'IA DÉVELOPPEUR

> **Message destinataire : IA Développeur / Assistant Code**  
> Lorsque vous générez du code pour ce projet, vous devez **STRICTEMENT** respecter les consignes ci-dessous :

1. **INTERDICTION D'UTILISER SUPABASE OU CLERK** :
   - Toute l'authentification doit utiliser **Better Auth**.
   - La base de données doit être gérée via **Drizzle ORM** connecté à un serveur PostgreSQL standard.

2. **GATHERING & MASS DATA** :
   - Les requêtes complexes sur les prospects doivent impérativement utiliser les index SQL définis dans le schéma.
   - Les données dynamiques provenant du scraping ou d'APIs tierces doivent être insérées dans le champ `enrichmentData` (JSONB).

3. **BACKGROUND JOBS** :
   - Aucune tâche lourde (scraping, envoi de mail en masse, traitement de fichier CSV) ne doit s'exécuter dans la requête HTTP principale.
   - Passez systématiquement par la file d'attente **BullMQ + Redis**.

4. **FICHIERS & EXPORTS** :
   - Tous les fichiers générés par l'utilisateur (exports CSV, PDF, avatars) doivent être envoyés sur **Cloudflare R2** via le SDK S3 (`@aws-sdk/client-s3`).

5. **MODULE ACADÉMIE** :
   - Garder le code du module Académie isolé dans le répertoire `src/modules/academy`.
```
eof