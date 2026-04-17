import type { MDXComponents } from "mdx/types";
import { Figure } from "@/components/case-study/Figure";
import { Metadata } from "@/components/case-study/Metadata";
import { DecisionBlock } from "@/components/case-study/DecisionBlock";
import { PrevNext } from "@/components/case-study/PrevNext";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Figure,
    Metadata,
    DecisionBlock,
    PrevNext,
    ...components,
  };
}
