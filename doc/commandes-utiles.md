# Mémo des commandes utiles 🚀

Voici un récapitulatif des commandes indispensables pour ton workflow de développement, incluant tes raccourcis personnalisés et tes configurations spécifiques.

> Pour les commandes **Claude Code** (Remote Control, `/clear`, skills…), voir [claude-code-aide-memoire.md](claude-code-aide-memoire.md).

## 1. Frontend & Node.js (Vue / Vite / etc.)
- `npm run dev` : Lance le serveur de développement local.
- `npm install` (ou `npm i`) : Installe toutes les dépendances du projet listées dans le `package.json`.
- `npm install <nom-du-paquet>` : Installe un nouveau paquet ou une bibliothèque.
- `npm run build` : Compile et prépare le projet pour la production.

---

## 2. Backend & Go (Ton projet Academy)
Pour naviguer et lancer ton serveur backend en mode développement :

```bash
cd backend/academy
go run ./cmd/academy-server -env development -addr :8080 -content content
```

---

## 3. Git & Raccourci personnalisé (`gpush`)

Pour automatiser le combo `add` + `commit` + `push`, tu peux enregistrer cette fonction directement dans ton fichier de configuration de terminal (`~/.bashrc` ou `~/.zshrc`) :

```bash
gpush() {
    git add .
    git commit -m "$1"
    git push
}
```

**Comment l'utiliser dans ton terminal :**
```bash
gpush "ton message de commit ici"
```

### Autres commandes Git essentielles :
- `git status` : Voir l'état des fichiers modifiés ou non validés.
- `git pull` : Télécharger et fusionner les dernières modifications du dépôt distant.
- `git checkout -b <nom-de-la-branche>` : Créer une nouvelle branche et basculer dessus immédiatement.
- `git branch` : Lister toutes les branches locales.

---

## 4. Navigation rapide dans le Terminal
- `cd <dossier>` : Entrer dans un dossier (ex: `cd backend`).
- `cd ..` : Reculer d'un dossier (revenir en arrière).
- `ls` (ou `dir` sur Windows) : Afficher la liste des fichiers et dossiers du répertoire actuel.
- `pwd` : Afficher le chemin complet du dossier où tu te trouves actuellement.