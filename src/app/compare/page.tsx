import { Suspense } from "react";
import { CompareLab } from "@/components/r7/compare-lab";

export default function ComparePage() {
  return <Suspense fallback={<section className="inner-page"><p className="eyebrow">COMPARE LAB</p></section>}><CompareLab /></Suspense>;
}
