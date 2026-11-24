// frontend/lib/core/legal-config.ts

export const A_COMPLETER = "[À COMPLÉTER]";

export type LegalEntityType = "societe" | "entrepreneur-individuel";

export type LegalConfig = {
  brand: string;
  domain: string;
  lastUpdated: string;
  entity: {
    type: LegalEntityType;
    name: string;
    form: string;
    capital: string;
    address: string;
    siren: string;
    registry: string;
    vatNumber: string;
    phone: string;
    publicationDirector: string;
  };
  host: {
    name: string;
    address: string;
    phone: string;
    dataLocation: string;
  };
  contacts: {
    general: string;
    legal: string;
    privacy: string;
    security: string;
  };
  processors: {
    payment: string;
  };
  billing: {
    priceBasis: string;
  };
};

export const LEGAL: LegalConfig = {
  brand: "LeadCortex",
  domain: "app.leadcortex.io",
  lastUpdated: "6 novembre 2026",
  entity: {
    type: "societe",
    name: A_COMPLETER,
    form: "SAS",
    capital: A_COMPLETER,
    address: A_COMPLETER,
    siren: A_COMPLETER,
    registry: A_COMPLETER,
    vatNumber: A_COMPLETER,
    phone: A_COMPLETER,
    publicationDirector: A_COMPLETER,
  },
  host: {
    name: A_COMPLETER,
    address: A_COMPLETER,
    phone: A_COMPLETER,
    dataLocation: A_COMPLETER,
  },
  contacts: {
    general: "contact@leadcortex.io",
    legal: "legal@leadcortex.io",
    privacy: "privacy@leadcortex.io",
    security: "security@leadcortex.io",
  },
  processors: {
    payment: "Stripe Payments Europe, Ltd. (Irlande)",
  },
  billing: {
    priceBasis: "hors taxes (HT)",
  },
};

export function isFilled(value: string): boolean {
  return value.trim().length > 0 && value !== A_COMPLETER;
}

export function missingLegalFields(): string[] {
  const { entity, host } = LEGAL;
  const missing: string[] = [];

  const entityFields: [string, string, boolean][] = [
    ["entity.name", entity.name, true],
    ["entity.address", entity.address, true],
    ["entity.siren", entity.siren, true],
    ["entity.phone", entity.phone, true],
    ["entity.publicationDirector", entity.publicationDirector, true],
    ["entity.vatNumber", entity.vatNumber, true],
    ["entity.capital", entity.capital, entity.type === "societe"],
    ["entity.registry", entity.registry, entity.type === "societe"],
  ];
  for (const [key, value, required] of entityFields) {
    if (required && !isFilled(value)) missing.push(key);
  }

  const hostFields: [string, string][] = [
    ["host.name", host.name],
    ["host.address", host.address],
    ["host.phone", host.phone],
    ["host.dataLocation", host.dataLocation],
  ];
  for (const [key, value] of hostFields) {
    if (!isFilled(value)) missing.push(key);
  }

  return missing;
}

export function publisherLabel(): string {
  const { entity } = LEGAL;
  if (!isFilled(entity.name)) return A_COMPLETER;
  return entity.type === "societe" ? entity.name : `${entity.name}, entrepreneur individuel`;
}
