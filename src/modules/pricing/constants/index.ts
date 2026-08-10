export const pricingKeys = {
  all: ["pricing"] as const,
  byEspacio: (id: number) => ["pricing", id] as const,
};
