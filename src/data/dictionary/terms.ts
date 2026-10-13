export type Region =
  | "Norte"
  | "Nordeste"
  | "Centro-Oeste"
  | "Sudeste"
  | "Sul";

export type Category =
  | "Natureza"
  | "Cultura"
  | "Culinária"
  | "Geografia";

export type DictionaryEntry = {
  id: string;
  word: string;
  definition: string;
  example: string;
  region: Region;
  category: Category;
};

export const terms: DictionaryEntry[] = [
  {
    id: "bioma",
    word: "Bioma",
    definition:
      "É uma grande área natural com clima, plantas e animais parecidos.",
    example: "A Amazônia é um dos biomas brasileiros.",
    region: "Norte",
    category: "Natureza",
  },
  {
    id: "amazonia",
    word: "Amazônia",
    definition:
      "É uma grande região de floresta, com muitos rios, plantas e animais.",
    example: "A Amazônia abriga espécies como a onça-pintada.",
    region: "Norte",
    category: "Geografia",
  },
  {
    id: "onca-pintada",
    word: "Onça-pintada",
    definition:
      "É um grande felino brasileiro, conhecido pelas manchas em sua pelagem.",
    example: "A onça-pintada vive em diferentes ambientes naturais.",
    region: "Norte",
    category: "Natureza",
  },
  {
    id: "rio-amazonas",
    word: "Rio Amazonas",
    definition:
      "É um dos rios mais conhecidos do Brasil e atravessa a região Norte.",
    example: "Muitas comunidades vivem perto do Rio Amazonas.",
    region: "Norte",
    category: "Geografia",
  },
  {
    id: "acaraje",
    word: "Acarajé",
    definition:
      "É um alimento feito com massa de feijão-fradinho e muito conhecido na Bahia.",
    example: "O acarajé faz parte da culinária baiana.",
    region: "Nordeste",
    category: "Culinária",
  },
  {
    id: "caatinga",
    word: "Caatinga",
    definition:
      "É um bioma brasileiro adaptado a períodos de pouca chuva.",
    example: "Cactos são plantas que podem ser encontrados na Caatinga.",
    region: "Nordeste",
    category: "Natureza",
  },
  {
    id: "frevo",
    word: "Frevo",
    definition:
      "É uma manifestação cultural com música e dança, muito ligada a Pernambuco.",
    example: "As sombrinhas coloridas aparecem em apresentações de frevo.",
    region: "Nordeste",
    category: "Cultura",
  },
  {
    id: "cerrado",
    word: "Cerrado",
    definition:
      "É um bioma com árvores de troncos retorcidos, campos e grande variedade de vida.",
    example: "O Cerrado ocupa áreas do Centro-Oeste brasileiro.",
    region: "Centro-Oeste",
    category: "Natureza",
  },
  {
    id: "pantanal",
    word: "Pantanal",
    definition:
      "É uma grande planície que passa por períodos de cheia e seca.",
    example: "A arara-azul é um dos animais encontrados no Pantanal.",
    region: "Centro-Oeste",
    category: "Geografia",
  },
  {
    id: "festa-junina",
    word: "Festa Junina",
    definition:
      "É uma festa popular brasileira com músicas, danças e comidas típicas.",
    example: "A quadrilha é uma dança comum nas festas juninas.",
    region: "Centro-Oeste",
    category: "Cultura",
  },
  {
    id: "mata-atlantica",
    word: "Mata Atlântica",
    definition:
      "É um bioma brasileiro que possui grande variedade de plantas e animais.",
    example: "Partes da Mata Atlântica ficam próximas ao litoral do Sudeste.",
    region: "Sudeste",
    category: "Natureza",
  },
  {
    id: "serra-do-mar",
    word: "Serra do Mar",
    definition:
      "É uma cadeia de montanhas que acompanha parte do litoral brasileiro.",
    example: "A Serra do Mar pode ser vista em áreas de São Paulo e do Rio de Janeiro.",
    region: "Sudeste",
    category: "Geografia",
  },
  {
    id: "paodequeijo",
    word: "Pão de queijo",
    definition:
      "É um alimento feito com polvilho e queijo, muito conhecido em Minas Gerais.",
    example: "O pão de queijo é comum na culinária mineira.",
    region: "Sudeste",
    category: "Culinária",
  },
  {
    id: "samba",
    word: "Samba",
    definition:
      "É um estilo musical e uma dança muito importantes na cultura brasileira.",
    example: "O samba é bastante conhecido no Rio de Janeiro.",
    region: "Sudeste",
    category: "Cultura",
  },
  {
    id: "pampas",
    word: "Pampas",
    definition:
      "São campos naturais com muitas gramíneas, encontrados principalmente no Sul.",
    example: "Os Pampas fazem parte da paisagem do Rio Grande do Sul.",
    region: "Sul",
    category: "Natureza",
  },
  {
    id: "chimarrao",
    word: "Chimarrão",
    definition:
      "É uma bebida feita com erva-mate e água quente, tradicional no Sul do Brasil.",
    example: "O chimarrão costuma ser compartilhado em uma cuia.",
    region: "Sul",
    category: "Culinária",
  },
  {
    id: "fandango",
    word: "Fandango",
    definition:
      "É uma manifestação cultural com música e dança presente em comunidades do Sul.",
    example: "O fandango caiçara é uma tradição cultural do litoral.",
    region: "Sul",
    category: "Cultura",
  },
  {
    id: "araucaria",
    word: "Araucária",
    definition:
      "É uma árvore de grande porte, também chamada de pinheiro-do-paraná.",
    example: "A araucária é uma árvore símbolo de áreas do Sul.",
    region: "Sul",
    category: "Natureza",
  },
];