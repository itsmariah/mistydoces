import "dotenv/config";
import { prisma } from "@/lib/prisma";

// PREÇOS SÃO PLACEHOLDER — ajuste aqui com os valores reais da loja antes de ir para produção.

type VariantSeed = { label: string; price: number; sortOrder: number };
type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  isAvailable?: boolean;
  variants: VariantSeed[];
};

const CATEGORIES = [
  { name: "Brigadeiros", slug: "brigadeiros" },
  { name: "Copos da Felicidade", slug: "copos-da-felicidade" },
  { name: "Brownies", slug: "brownies" },
  { name: "Morango", slug: "morango" },
  { name: "Sobremesas Individuais", slug: "sobremesas-individuais" },
  { name: "Cookies", slug: "cookies" },
  { name: "Kits e Caixas", slug: "kits-e-caixas" },
] as const;

function single(price: number): VariantSeed[] {
  return [{ label: "Único", price, sortOrder: 0 }];
}

const BRIGADEIRO_FORMATS: VariantSeed[] = [
  { label: "Unidade", price: 4, sortOrder: 0 },
  { label: "Caixa com 4", price: 15, sortOrder: 1 },
  { label: "Caixa com 6", price: 21, sortOrder: 2 },
  { label: "Caixa com 12", price: 40, sortOrder: 3 },
];

const BRIGADEIROS: ProductSeed[] = [
  {
    name: "Brigadeiro Tradicional",
    slug: "brigadeiro-tradicional",
    description: "O clássico de chocolate meio amargo com granulado belga.",
    categorySlug: "brigadeiros",
    variants: BRIGADEIRO_FORMATS,
  },
  {
    name: "Brigadeiro de Leite Ninho",
    slug: "brigadeiro-leite-ninho",
    description: "Recheio cremoso de leite ninho, envolto em coco ralado.",
    categorySlug: "brigadeiros",
    variants: BRIGADEIRO_FORMATS,
  },
  {
    name: "Brigadeiro de Ninho com Nutella",
    slug: "brigadeiro-ninho-nutella",
    description: "Leite ninho cremoso com um coração de Nutella.",
    categorySlug: "brigadeiros",
    variants: BRIGADEIRO_FORMATS,
  },
  {
    name: "Brigadeiro de Oreo",
    slug: "brigadeiro-oreo",
    description: "Chocolate cremoso com pedaços de biscoito Oreo triturado.",
    categorySlug: "brigadeiros",
    variants: BRIGADEIRO_FORMATS,
  },
  {
    name: "Brigadeiro de Paçoca",
    slug: "brigadeiro-pacoca",
    description: "Amendoim torrado moído no ponto certo com um toque de doce de leite.",
    categorySlug: "brigadeiros",
    variants: BRIGADEIRO_FORMATS,
  },
  {
    name: "Brigadeiro de Chocolate Branco",
    slug: "brigadeiro-chocolate-branco",
    description: "Cremoso, suave e finalizado com granulado de chocolate branco.",
    categorySlug: "brigadeiros",
    variants: BRIGADEIRO_FORMATS,
  },
  {
    name: "Brigadeiro de Churros",
    slug: "brigadeiro-churros",
    description: "Canela e doce de leite lembrando o clássico churros de festa.",
    categorySlug: "brigadeiros",
    variants: BRIGADEIRO_FORMATS,
  },
  {
    name: "Brigadeiro de Pistache",
    slug: "brigadeiro-pistache",
    description: "Casquinha crocante de pistache sobre recheio cremoso.",
    categorySlug: "brigadeiros",
    variants: BRIGADEIRO_FORMATS,
  },
  {
    name: "Brigadeiro de Limão",
    slug: "brigadeiro-limao",
    description: "Toque cítrico e refrescante no clássico brigadeiro cremoso.",
    categorySlug: "brigadeiros",
    variants: BRIGADEIRO_FORMATS,
  },
  {
    name: "Brigadeiro de Coco",
    slug: "brigadeiro-coco",
    description: "Recheio de coco cremoso coberto com coco ralado queimado.",
    categorySlug: "brigadeiros",
    variants: BRIGADEIRO_FORMATS,
  },
  {
    name: "Caixa Degustação de Brigadeiros",
    slug: "brigadeiros-caixa-degustacao",
    description: "Uma caixa com sabores variados para experimentar o melhor da loja.",
    categorySlug: "brigadeiros",
    variants: [{ label: "Caixa degustação (sabores variados)", price: 45, sortOrder: 0 }],
  },
];

const COPOS_DA_FELICIDADE: ProductSeed[] = [
  {
    name: "Copo da Felicidade Ninho com Nutella",
    slug: "copo-ninho-nutella",
    description: "Camadas de leite ninho cremoso e Nutella em um copo generoso.",
    categorySlug: "copos-da-felicidade",
    variants: single(14),
  },
  {
    name: "Copo da Felicidade Morango com Ninho",
    slug: "copo-morango-ninho",
    description: "Morango fresquinho com camadas de creme de leite ninho.",
    categorySlug: "copos-da-felicidade",
    variants: single(15),
  },
  {
    name: "Copo da Felicidade Oreo",
    slug: "copo-oreo",
    description: "Creme de chocolate com pedaços generosos de biscoito Oreo.",
    categorySlug: "copos-da-felicidade",
    variants: single(14),
  },
  {
    name: "Copo da Felicidade Kinder",
    slug: "copo-kinder",
    description: "Creme aveludado inspirado no chocolate Kinder, com pedaços crocantes.",
    categorySlug: "copos-da-felicidade",
    variants: single(16),
  },
  {
    name: "Copo da Felicidade Brownie com Brigadeiro",
    slug: "copo-brownie-brigadeiro",
    description: "Camadas de brownie úmido intercaladas com brigadeiro cremoso.",
    categorySlug: "copos-da-felicidade",
    variants: single(15),
  },
  {
    name: "Copo da Felicidade Prestígio",
    slug: "copo-prestigio",
    description: "Chocolate e coco em camadas cremosas, direto do clássico prestígio.",
    categorySlug: "copos-da-felicidade",
    variants: single(14),
  },
  {
    name: "Copo da Felicidade Red Velvet",
    slug: "copo-red-velvet",
    description: "Camadas aveludadas de red velvet com cream cheese.",
    categorySlug: "copos-da-felicidade",
    variants: single(15),
  },
  {
    name: "Copo da Felicidade Pistache",
    slug: "copo-pistache",
    description: "Creme suave de pistache com uma casquinha crocante por cima.",
    categorySlug: "copos-da-felicidade",
    variants: single(17),
  },
  {
    name: "Copo da Felicidade Banoffee",
    slug: "copo-banoffee",
    description: "Banana, doce de leite e chantilly em camadas irresistíveis.",
    categorySlug: "copos-da-felicidade",
    variants: single(15),
  },
  {
    name: "Copo da Felicidade Maracujá com Chocolate",
    slug: "copo-maracuja-chocolate",
    description: "O equilíbrio perfeito entre o azedinho do maracujá e o chocolate cremoso.",
    categorySlug: "copos-da-felicidade",
    variants: single(15),
  },
];

const BROWNIES: ProductSeed[] = [
  {
    name: "Brownie Tradicional",
    slug: "brownie-tradicional",
    description: "Massa úmida e intensa de chocolate, do jeito que tem que ser.",
    categorySlug: "brownies",
    variants: single(9),
  },
  {
    name: "Brownie com Nutella",
    slug: "brownie-nutella",
    description: "Brownie tradicional com um recheio generoso de Nutella.",
    categorySlug: "brownies",
    variants: single(11),
  },
  {
    name: "Brownie com Ninho",
    slug: "brownie-ninho",
    description: "Brownie de chocolate com cobertura cremosa de leite ninho.",
    categorySlug: "brownies",
    variants: single(11),
  },
  {
    name: "Brownie com Oreo",
    slug: "brownie-oreo",
    description: "Pedaços de Oreo incorporados à massa e por cima também.",
    categorySlug: "brownies",
    variants: single(11),
  },
  {
    name: "Brownie com Caramelo",
    slug: "brownie-caramelo",
    description: "Caramelo derretido escorrendo sobre o brownie de chocolate.",
    categorySlug: "brownies",
    variants: single(11),
  },
  {
    name: "Brownie com Pistache",
    slug: "brownie-pistache",
    description: "Toque sofisticado de pistache sobre o brownie tradicional.",
    categorySlug: "brownies",
    variants: single(13),
  },
];

const MORANGO: ProductSeed[] = [
  {
    name: "Morango do Amor",
    slug: "morango-do-amor",
    description: "Morango fresco coberto de chocolate crocante e caramelo.",
    categorySlug: "morango",
    variants: single(8),
  },
  {
    name: "Bombom de Morango",
    slug: "bombom-de-morango",
    description: "Morango envolto em uma casquinha de chocolate, como um bombom.",
    categorySlug: "morango",
    variants: single(7),
  },
  {
    name: "Morango com Ninho",
    slug: "morango-com-ninho",
    description: "Morango fresco com creme de leite ninho por cima.",
    categorySlug: "morango",
    variants: single(9),
  },
  {
    name: "Morango com Chocolate",
    slug: "morango-com-chocolate",
    description: "Morango fresco banhado em chocolate meio amargo.",
    categorySlug: "morango",
    variants: single(8),
  },
  {
    name: "Travessa de Morango",
    slug: "travessa-de-morango",
    description: "Camadas generosas de morango, creme e chocolate para compartilhar.",
    categorySlug: "morango",
    variants: single(65),
  },
  {
    name: "Copo de Morango",
    slug: "copo-de-morango",
    description: "Morango fresco em camadas de creme em um copo individual.",
    categorySlug: "morango",
    variants: single(14),
  },
  {
    name: "Cone de Morango",
    slug: "cone-de-morango",
    description: "Casquinha crocante recheada de creme e morango fresco.",
    categorySlug: "morango",
    variants: single(10),
  },
];

const SOBREMESAS_INDIVIDUAIS: ProductSeed[] = [
  {
    name: "Fatia de Bolo de Chocolate",
    slug: "fatia-bolo-chocolate",
    description: "Fatia generosa de bolo de chocolate com cobertura cremosa.",
    categorySlug: "sobremesas-individuais",
    variants: single(12),
  },
  {
    name: "Fatia de Bolo de Cenoura com Brigadeiro",
    slug: "fatia-bolo-cenoura-brigadeiro",
    description: "O queridinho de sempre: bolo de cenoura fofinho com brigadeiro.",
    categorySlug: "sobremesas-individuais",
    variants: single(12),
  },
  {
    name: "Fatia de Red Velvet",
    slug: "fatia-red-velvet",
    description: "Clássico americano aveludado com cobertura de cream cheese.",
    categorySlug: "sobremesas-individuais",
    variants: single(13),
  },
  {
    name: "Fatia de Bolo de Ninho",
    slug: "fatia-bolo-ninho",
    description: "Massa fofinha com recheio e cobertura cremosa de leite ninho.",
    categorySlug: "sobremesas-individuais",
    variants: single(13),
  },
  {
    name: "Fatia de Bolo de Churros",
    slug: "fatia-bolo-churros",
    description: "Canela e doce de leite em um bolo macio e aromático.",
    categorySlug: "sobremesas-individuais",
    variants: single(12),
  },
  {
    name: "Fatia de Bolo de Limão",
    slug: "fatia-bolo-limao",
    description: "Bolo leve com toque cítrico e cobertura cremosa de limão.",
    categorySlug: "sobremesas-individuais",
    variants: single(12),
  },
  {
    name: "Fatia de Bolo de Maracujá",
    slug: "fatia-bolo-maracuja",
    description: "Bolo macio com creme de maracujá levemente azedinho.",
    categorySlug: "sobremesas-individuais",
    variants: single(12),
  },
  {
    name: "Banoffee",
    slug: "sobremesa-banoffee",
    description: "Camadas de banana, doce de leite, chantilly e base crocante.",
    categorySlug: "sobremesas-individuais",
    variants: single(15),
  },
  {
    name: "Cheesecake",
    slug: "sobremesa-cheesecake",
    description: "Cremoso, com base amanteigada e calda de frutas vermelhas.",
    categorySlug: "sobremesas-individuais",
    variants: single(15),
  },
  {
    name: "Torta de Limão",
    slug: "sobremesa-torta-limao",
    description: "Base crocante, creme de limão e merengue maçaricado.",
    categorySlug: "sobremesas-individuais",
    variants: single(14),
  },
  {
    name: "Torta de Chocolate",
    slug: "sobremesa-torta-chocolate",
    description: "Base crocante com recheio denso de chocolate meio amargo.",
    categorySlug: "sobremesas-individuais",
    variants: single(14),
  },
  {
    name: "Pudim",
    slug: "sobremesa-pudim",
    description: "O pudim de leite condensado clássico, com calda de caramelo.",
    categorySlug: "sobremesas-individuais",
    variants: single(10),
  },
  {
    name: "Mousse de Maracujá",
    slug: "sobremesa-mousse-maracuja",
    description: "Leve, aerado e com o azedinho característico do maracujá.",
    categorySlug: "sobremesas-individuais",
    variants: single(11),
  },
  {
    name: "Mousse de Chocolate",
    slug: "sobremesa-mousse-chocolate",
    description: "Cremoso e aerado, para quem não abre mão de um chocolate intenso.",
    categorySlug: "sobremesas-individuais",
    variants: single(11),
  },
];

const COOKIES: ProductSeed[] = [
  {
    name: "Cookie de Chocolate",
    slug: "cookie-chocolate",
    description: "Crocante por fora, macio por dentro, recheado de gotas de chocolate.",
    categorySlug: "cookies",
    variants: single(8),
  },
  {
    name: "Cookie de Nutella",
    slug: "cookie-nutella",
    description: "Massa amanteigada com um recheio generoso de Nutella.",
    categorySlug: "cookies",
    variants: single(9),
  },
  {
    name: "Cookie Red Velvet",
    slug: "cookie-red-velvet",
    description: "Massa aveludada com gotas de chocolate branco.",
    categorySlug: "cookies",
    variants: single(9),
  },
  {
    name: "Cookie Ninho com Nutella",
    slug: "cookie-ninho-nutella",
    description: "Massa de leite ninho com recheio de Nutella.",
    categorySlug: "cookies",
    variants: single(9),
  },
  {
    name: "Cookie de Pistache",
    slug: "cookie-pistache",
    description: "Massa amanteigada com pedaços crocantes de pistache.",
    categorySlug: "cookies",
    variants: single(10),
  },
];

const KITS_E_CAIXAS: ProductSeed[] = [
  {
    name: "Kit Degustação",
    slug: "kit-degustacao",
    description: "6 doces diferentes para experimentar o melhor da loja.",
    categorySlug: "kits-e-caixas",
    variants: single(45),
  },
  {
    name: "Kit Casal",
    slug: "kit-casal",
    description: "2 brownies + 2 brigadeiros + 1 sobremesa, para dividir a dois.",
    categorySlug: "kits-e-caixas",
    variants: single(60),
  },
  {
    name: "Kit Presente",
    slug: "kit-presente",
    description: "Caixa bonita com doces sortidos, pronta para presentear.",
    categorySlug: "kits-e-caixas",
    variants: [
      { label: "6 doces", price: 50, sortOrder: 0 },
      { label: "12 doces", price: 90, sortOrder: 1 },
    ],
  },
  {
    name: "Kit Festa",
    slug: "kit-festa",
    description: "Brigadeiros sortidos em quantidade para festas e eventos.",
    categorySlug: "kits-e-caixas",
    variants: [
      { label: "25 unidades", price: 90, sortOrder: 0 },
      { label: "50 unidades", price: 170, sortOrder: 1 },
      { label: "100 unidades", price: 320, sortOrder: 2 },
    ],
  },
  {
    name: "Kit Aniversário",
    slug: "kit-aniversario",
    description: "Brigadeiros, brownies e mini doces para celebrar em grande estilo.",
    categorySlug: "kits-e-caixas",
    variants: single(120),
  },
];

const PRODUCTS: ProductSeed[] = [
  ...BRIGADEIROS,
  ...COPOS_DA_FELICIDADE,
  ...BROWNIES,
  ...MORANGO,
  ...SOBREMESAS_INDIVIDUAIS,
  ...COOKIES,
  ...KITS_E_CAIXAS,
];

async function main() {
  // Reseta o catálogo por completo — ainda não há pedidos reais que dependam desses IDs.
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const categoryIds = new Map<string, string>();
  for (const category of CATEGORIES) {
    const created = await prisma.category.create({ data: category });
    categoryIds.set(category.slug, created.id);
  }

  for (const product of PRODUCTS) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) continue;

    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId,
        isAvailable: product.isAvailable ?? true,
        variants: {
          create: product.variants.map((variant) => ({
            label: variant.label,
            price: variant.price,
            sortOrder: variant.sortOrder,
          })),
        },
      },
    });
  }

  console.log(
    `Seed concluído: ${CATEGORIES.length} categorias, ${PRODUCTS.length} produtos.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
