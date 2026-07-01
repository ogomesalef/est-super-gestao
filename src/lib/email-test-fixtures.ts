import type { AmbassadorLike } from "@/lib/email-templates";

export function buildTestAmbassador(
  program: "OAB" | "ECJ",
  email: string,
  modality: "Assinatura + Cupom" | "Remuneração"
): AmbassadorLike {
  return {
    fullName: "Maria Demonstração",
    email,
    program,
    partnership: {
      modality,
      agreedValue: 1712.57,
      courseName: "Curso de Demonstração",
      couponCode: "EMBAIXADOR-TESTE",
      courseReleaseDate: new Date(),
      metaFeed: 4,
      metaStories: 4,
      metaTiktok: 4,
      metaYoutube: 0,
    },
  };
}

export const TEST_EMAIL_VARS = {
  courseName: "Curso de Demonstração",
  couponCode: "EMBAIXADOR-TESTE",
  releaseDate: new Date().toISOString().slice(0, 10),
  productValue: 1712.57,
};
