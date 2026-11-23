import { SITE_TITLE } from "@/lib/site";
import { renderSocialImage, SOCIAL_SIZE } from "@/lib/socialImage";

export const alt = SITE_TITLE;
export const size = SOCIAL_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return renderSocialImage();
}
