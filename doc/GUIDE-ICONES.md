# Icônes Papicons

Les icônes de l’application sont fournies par le module local
`frontend/components/icons`. Il ne charge aucune bibliothèque d’icônes distante
et ne dépend pas de `lucide-react`.

## Utiliser les icônes de l’application

Les imports existants utilisent des noms compatibles pour limiter les
changements dans les composants :

```tsx
import { Mail, ChevronRight } from "@/components/icons";
```

Les icônes Papicons officielles sont aussi disponibles directement à partir de
leurs fichiers SVG :

```tsx
import { Papicon } from "@/components/icons/papicon";

<Papicon name="walk" size={24} className="text-primary" />;
```

`PapiconName` est dérivé des fichiers présents dans
`frontend/components/icons/papicons`. La bibliothèque complète (112 SVG et son
fichier de licence) est conservée localement. Les icônes Papicons sont utilisées
lorsqu’un glyphe correspondant existe ; des dessins locaux cohérents et des
alias vers les glyphes les plus proches assurent la compatibilité des autres
noms utilisés par l’application.

Les SVG Papicons sont sous licence MIT. Leur licence et leur attribution sont
conservées dans `frontend/components/icons/papicons/LICENSE`.

`components.json` conserve `iconLibrary: "lucide"` pour la compatibilité avec le
CLI shadcn ; ce réglage ne charge pas Lucide dans l’application. Pour tout
nouveau composant, importer les icônes depuis `@/components/icons`.
