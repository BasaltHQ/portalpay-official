import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Legacy route shim:
 * This page now redirects to the unified Developer Dashboard Products view,
 * which sources items from the brand-curated catalog API.
 */
export default function ProductsIndexRedirect() {
  redirect("/developers/dashboard/products");
}
