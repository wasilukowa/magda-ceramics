import { REVIEWS } from "@/content/reviews";
import { Review } from "@/content/types";

// Dziesiątka do sliderów. Gdyby kiedyś nikt nie był oznaczony jako wyróżniony,
// slider pokazuje komplet zamiast pustki.
export const getFeaturedReviews = (): Review[] => {
  const wybrane = REVIEWS.filter((review) => review.featured);
  return wybrane.length > 0 ? wybrane : REVIEWS;
};
