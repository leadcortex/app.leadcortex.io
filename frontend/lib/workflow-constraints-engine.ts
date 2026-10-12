//frontend\lib\workflow-constraints-engine.ts
export const constraintEngine = {
  getBlockConstraints(blockId: string) {
    return [] as { description: string }[];
  },

  validateConnection({ fromBlock, toBlock, fromNode, toNode, branchId }: any) {
    return { allowed: true as const, reason: "" };
  },
};
