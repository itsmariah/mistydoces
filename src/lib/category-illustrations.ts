/**
 * Ilustração de cada categoria, pelo slug. Categoria não tem campo de imagem no banco;
 * uma categoria nova criada no admin cai no rostinho da Misty até ganhar uma entrada aqui.
 */
const CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  brigadeiros: "/branding/22_coracao_xadrez_com_laco.png",
  "copos-da-felicidade": "/branding/28_coracao_lilas.png",
  brownies: "/branding/14_pote_de_biscoitos.png",
  morango: "/branding/08_morango.png",
  "sobremesas-individuais": "/branding/07_cupcake.png",
  cookies: "/branding/20_prato_de_cookies.png",
  "kits-e-caixas": "/branding/18_laco_azul.png",
};
const FALLBACK_ILLUSTRATION = "/branding/13_rostinho_da_misty.png";

export function categoryIllustration(slug: string): string {
  return CATEGORY_ILLUSTRATIONS[slug] ?? FALLBACK_ILLUSTRATION;
}
