import ProductDetailsClient from "@/components/ProductDetailsClient";

export default function ProductPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { format?: string };
}) {
  return (
    <ProductDetailsClient
      slug={params.slug}
      initialFormat={searchParams?.format}
    />
  );
}
