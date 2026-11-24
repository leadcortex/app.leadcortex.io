// frontend/hooks/use-global-search.ts

import { useMemo } from "react";
import { Users, Building2, Send, Target } from "@/components/icons";
import { useAppStore } from "@/lib/state/store";
import { useDebounce } from "@/hooks/use-debounce";

export type SearchCategory = "prospects" | "companies" | "sequences" | "deals";

export type SearchResult = {
  id: string;
  label: string;
  subtitle: string;
  category: SearchCategory;
  icon: typeof Users;
  url: string;
  score?: number;
  saved?: boolean;
  searchRank: number;
  labelMatches: number[];
  subtitleMatches: number[];
};

export type TextMatch = { score: number; indices: number[] };

function normalizedCharacters(value: string) {
  const characters: string[] = [];
  const indices: number[] = [];

  Array.from(value).forEach((character, index) => {
    const normalized = character
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    for (const candidate of normalized) {
      if (!/[a-z0-9]/.test(candidate)) continue;
      characters.push(candidate);
      indices.push(index);
    }
  });

  return { characters, indices };
}

export function matchSearchText(query: string, value: string): TextMatch | null {
  const needle = normalizedCharacters(query).characters;
  if (needle.length === 0) return null;

  const text = normalizedCharacters(value);
  const source = Array.from(value);
  const positions: number[] = [];
  let cursor = 0;

  for (const character of needle) {
    const position = text.characters.indexOf(character, cursor);
    if (position === -1) return null;
    positions.push(position);
    cursor = position + 1;
  }

  const first = positions[0]!;
  const last = positions[positions.length - 1]!;
  let score = first === 0 ? 24 : Math.max(0, 12 - first);
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i]!;
    if (i > 0 && position === positions[i - 1]! + 1) score += 7;
    const sourceIndex = text.indices[position]!;
    const previousCharacter = source[sourceIndex - 1] ?? "";
    if (sourceIndex === 0 || !/[a-z0-9]/i.test(previousCharacter)) score += 4;
  }
  score -= Math.max(0, last - first + 1 - needle.length) * 0.5;

  return {
    score,
    indices: Array.from(new Set(positions.map((position) => text.indices[position]!))),
  };
}

function bestMatch(query: string, values: string[]) {
  return values.reduce<TextMatch | null>((best, value) => {
    const match = matchSearchText(query, value);
    return match && (!best || match.score > best.score) ? match : best;
  }, null);
}

function makeSearchResult(
  result: Omit<SearchResult, "searchRank" | "labelMatches" | "subtitleMatches">,
  searchable: string[],
  query: string,
): SearchResult | null {
  const match = bestMatch(query, searchable);
  if (!match) return null;

  return {
    ...result,
    searchRank: match.score,
    labelMatches: matchSearchText(query, result.label)?.indices ?? [],
    subtitleMatches: matchSearchText(query, result.subtitle)?.indices ?? [],
  };
}

export const SEARCH_CATEGORY_LABELS: Record<SearchCategory, string> = {
  prospects: "Prospects",
  companies: "Entreprises",
  sequences: "Séquences",
  deals: "Opportunités",
};

export const SEARCH_CATEGORY_ICONS: Record<SearchCategory, typeof Users> = {
  prospects: Users,
  companies: Building2,
  sequences: Send,
  deals: Target,
};

export const SEARCH_CATEGORY_ORDER = ["prospects", "companies", "sequences", "deals"] as const;

export type SearchQuickAction = {
  id: string;
  label: string;
  icon: typeof Users;
  url: string;
};

export function useGlobalSearchResults(query: string) {
  const store = useAppStore();
  const debouncedQuery = useDebounce(query, 200);

  const results = useMemo<SearchResult[]>(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.trim();

    const searchInLeads = (): SearchResult[] =>
      store.leads.flatMap((lead) => {
        const label = lead.name;
        const subtitle = `${lead.title} · ${lead.company}`;
        const result = makeSearchResult(
          {
            id: lead.id,
            label,
            subtitle,
            category: "prospects",
            icon: Users,
            url: `/app/people/${lead.id}`,
            score: lead.score ?? undefined,
            saved: lead.saved,
          },
          [lead.name, lead.company, lead.title, lead.email ?? ""],
          q,
        );
        return result ? [result] : [];
      });

    const searchInCompanies = (): SearchResult[] =>
      store.companies.flatMap((company) => {
        const result = makeSearchResult(
          {
            id: company.id,
            label: company.name,
            subtitle: `${company.industry} · ${company.location}`,
            category: "companies",
            icon: Building2,
            url: `/app/companies/${company.id}`,
            saved: company.saved,
          },
          [company.name, company.domain, company.industry, company.location],
          q,
        );
        return result ? [result] : [];
      });

    const searchInSequences = (): SearchResult[] =>
      store.sequences.flatMap((sequence) => {
        const result = makeSearchResult(
          {
            id: sequence.id,
            label: sequence.name,
            subtitle: `${sequence.leads} leads · ${sequence.opens} d'ouverture`,
            category: "sequences",
            icon: Send,
            url: `/app/sequences/${sequence.id}`,
          },
          [sequence.name],
          q,
        );
        return result ? [result] : [];
      });

    const searchInDeals = (): SearchResult[] =>
      store.deals.flatMap((deal) => {
        const result = makeSearchResult(
          {
            id: deal.id,
            label: deal.name,
            subtitle: `${deal.company} · ${deal.amount.toLocaleString("fr-FR")} €`,
            category: "deals",
            icon: Target,
            url: `/app/deals/${deal.id}`,
          },
          [deal.name, deal.company, deal.contact],
          q,
        );
        return result ? [result] : [];
      });

    const all = [
      ...searchInLeads(),
      ...searchInCompanies(),
      ...searchInSequences(),
      ...searchInDeals(),
    ];

    return all.sort((a, b) => {
      if (a.searchRank !== b.searchRank) return b.searchRank - a.searchRank;
      if (a.score && b.score) return b.score - a.score;
      if (a.score) return -1;
      if (b.score) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [store, debouncedQuery]);

  const groupedResults = useMemo(() => {
    const groups: Record<SearchCategory, SearchResult[]> = {
      prospects: [],
      companies: [],
      sequences: [],
      deals: [],
    };
    results.forEach((r) => groups[r.category].push(r));
    return groups;
  }, [results]);

  const quickActions = useMemo<SearchQuickAction[]>(() => {
    if (!debouncedQuery.trim()) return [];
    const actions: SearchQuickAction[] = [];
    if (!results.some((r) => r.category === "prospects")) {
      actions.push({
        id: "create-lead",
        label: `Créer un prospect "${debouncedQuery}"`,
        icon: Users,
        url: "/app/people/new",
      });
    }
    if (!results.some((r) => r.category === "companies")) {
      actions.push({
        id: "create-company",
        label: `Créer une entreprise "${debouncedQuery}"`,
        icon: Building2,
        url: "/app/companies/new",
      });
    }
    return actions;
  }, [debouncedQuery, results]);

  return { debouncedQuery, results, groupedResults, quickActions };
}
