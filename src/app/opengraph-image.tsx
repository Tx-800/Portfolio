import { SITE_TITLE } from "@/lib/site";
import { renderSocialImage, SOCIAL_SIZE } from "@/lib/socialImage";

// Site-wide Open Graph image (also used by /classic and as the fallback for case studies).
export const alt = SITE_TITLE;
export const size = SOCIAL_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return renderSocialImage();
}
