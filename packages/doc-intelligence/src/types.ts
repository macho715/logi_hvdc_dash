export interface DocItem {
  source: "plan";
  category: string;
  sectionPath: string;
  text: string;
  checked: boolean;
}

export interface CategoryStats {
  category: string;
  done: number;
  total: number;
}

export interface PlanDiffIssue {
  kind: "total-tests" | "category";
  category?: string;
  expectedDone: number;
  expectedTotal: number;
  actualDone: number;
  actualTotal: number;
}
