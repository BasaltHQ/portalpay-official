
import { BRANDS } from "./src/config/brands/index";
import { getBrandKey } from "./src/config/brands/index";

console.log("NEXT_PUBLIC_BRAND_KEY:", process.env.NEXT_PUBLIC_BRAND_KEY);
console.log("BRAND_KEY:", process.env.BRAND_KEY);
console.log("Calculated getBrandKey():", getBrandKey());
console.log("Available Brands:", Object.keys(BRANDS));
