import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SHOES, getShoe } from "@/data/shoes";
import { ShoeDetail } from "@/components/r7/shoe-detail";

export function generateStaticParams() {
  return SHOES.map((s) => ({ slug: s.id }));
}

async function DetailBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getShoe(slug)) notFound();
  return <ShoeDetail id={slug} />;
}

export default function ShoeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<section className="inner-page r7-page" aria-busy="true" />}>
      <DetailBody params={params} />
    </Suspense>
  );
}