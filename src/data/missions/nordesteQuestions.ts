export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
  /** Usada nos níveis iniciais, que mostram só 2 alternativas (correta + esta). */
  simple?: boolean;
}

export interface QuizQuestion {
  id: string;
  icon: string;
  prompt: string;
  /** 1 alternativa correta + 3 incorretas (uma delas marcada como "simple"). */
  options: QuizOption[];
  fact: string;
}

export const NORDESTE_QUESTIONS: QuizQuestion[] = [
  {
    id: "caatinga",
    icon: "🌵",
    prompt: "Qual vegetação, adaptada à seca, é típica do sertão nordestino?",
    options: [
      { id: "caatinga", text: "Caatinga", correct: true },
      { id: "amazonia", text: "Floresta Amazônica", simple: true, correct: false },
      { id: "cerrado", text: "Cerrado", correct: false },
      { id: "mata-atlantica", text: "Mata Atlântica", correct: false },
    ],
    fact: "A Caatinga é o único bioma exclusivamente brasileiro, com plantas que resistem a longos períodos sem chuva.",
  },
  {
    id: "frevo",
    icon: "☂️",
    prompt: "Qual ritmo, dançado com sombrinhas coloridas, é símbolo do Carnaval de Recife e Olinda?",
    options: [
      { id: "frevo", text: "Frevo", correct: true },
      { id: "samba", text: "Samba", simple: true, correct: false },
      { id: "axe", text: "Axé", correct: false },
      { id: "sertanejo", text: "Sertanejo", correct: false },
    ],
    fact: "O frevo é uma dança muito rápida, criada em Pernambuco, e é Patrimônio Cultural Imaterial da Humanidade.",
  },
  {
    id: "acaraje",
    icon: "🍢",
    prompt: "Feito de feijão-fradinho frito no azeite de dendê, esse prato é vendido pelas baianas nas ruas. Qual é o nome dele?",
    options: [
      { id: "acaraje", text: "Acarajé", correct: true },
      { id: "coxinha", text: "Coxinha", simple: true, correct: false },
      { id: "tapioca", text: "Tapioca", correct: false },
      { id: "pao-de-queijo", text: "Pão de queijo", correct: false },
    ],
    fact: "O acarajé é um prato típico da Bahia, com raízes na culinária africana trazida ao Brasil.",
  },
  {
    id: "sao-joao",
    icon: "🔥",
    prompt: "Qual festa, com fogueiras, quadrilha e forró, é uma das mais celebradas no Nordeste em junho?",
    options: [
      { id: "sao-joao", text: "Festa de São João", correct: true },
      { id: "carnaval", text: "Carnaval", simple: true, correct: false },
      { id: "reveillon", text: "Réveillon", correct: false },
      { id: "festa-do-peao", text: "Festa do Peão", correct: false },
    ],
    fact: "As festas juninas nordestinas celebram a colheita e o santo São João, com muita música e comidas típicas de milho.",
  },
  {
    id: "pelourinho",
    icon: "🏛️",
    prompt: "Esse centro histórico de Salvador, com casas coloridas e ladeiras, é Patrimônio Mundial da UNESCO. Qual é o nome dele?",
    options: [
      { id: "pelourinho", text: "Pelourinho", correct: true },
      { id: "ouro-preto", text: "Ouro Preto", simple: true, correct: false },
      { id: "ipanema", text: "Ipanema", correct: false },
      { id: "asa-norte", text: "Asa Norte", correct: false },
    ],
    fact: "O Pelourinho fica no centro histórico de Salvador (BA) e é famoso por sua arquitetura colonial colorida.",
  },
  {
    id: "mandacaru",
    icon: "🌵",
    prompt: "Qual planta, um cacto bem resistente à seca, é um símbolo da paisagem do sertão?",
    options: [
      { id: "mandacaru", text: "Mandacaru", correct: true },
      { id: "vitoria-regia", text: "Vitória-régia", simple: true, correct: false },
      { id: "pau-brasil", text: "Pau-brasil", correct: false },
      { id: "ipe", text: "Ipê", correct: false },
    ],
    fact: "O mandacaru é um cacto que armazena água e consegue sobreviver em meses de seca no sertão nordestino.",
  },
  {
    id: "forro",
    icon: "🪗",
    prompt: "Tocado com sanfona, zabumba e triângulo, qual ritmo é uma das marcas musicais mais tradicionais do Nordeste?",
    options: [
      { id: "forro", text: "Forró", correct: true },
      { id: "samba", text: "Samba", simple: true, correct: false },
      { id: "axe", text: "Axé", correct: false },
      { id: "funk", text: "Funk", correct: false },
    ],
    fact: "O forró é tocado com o trio sanfona, zabumba e triângulo, e é muito dançado nas festas juninas.",
  },
  {
    id: "tapioca",
    icon: "🫓",
    prompt: "Feita com a fécula da mandioca, essa comida nordestina é bem popular no café da manhã. Qual é o nome dela?",
    options: [
      { id: "tapioca", text: "Tapioca", correct: true },
      { id: "pamonha", text: "Pamonha", simple: true, correct: false },
      { id: "farofa", text: "Farofa", correct: false },
      { id: "polenta", text: "Polenta", correct: false },
    ],
    fact: "A tapioca é feita da goma extraída da mandioca e pode ser recheada de diversas formas.",
  },
  {
    id: "cordel",
    icon: "📖",
    prompt: "Qual tipo de literatura popular, com folhetos ilustrados em xilogravura e versos rimados, é uma tradição nordestina?",
    options: [
      { id: "cordel", text: "Literatura de cordel", correct: true },
      { id: "romance", text: "Romance policial", simple: true, correct: false },
      { id: "quadrinhos", text: "História em quadrinhos", correct: false },
      { id: "fabula", text: "Fábula europeia", correct: false },
    ],
    fact: "A literatura de cordel conta histórias em versos e é tradicionalmente pendurada em barbantes (cordéis) nas feiras.",
  },
  {
    id: "renda-de-bilro",
    icon: "🧵",
    prompt: "Qual artesanato tradicional nordestino é feito entrelaçando linhas com pequenos bastões de madeira?",
    options: [
      { id: "renda-de-bilro", text: "Renda de bilro", correct: true },
      { id: "ceramica", text: "Cerâmica marajoara", simple: true, correct: false },
      { id: "vidro", text: "Vitral de vidro", correct: false },
      { id: "tricô", text: "Tricô europeu", correct: false },
    ],
    fact: "A renda de bilro é feita por rendeiras, muito comum no litoral do Ceará e de outros estados nordestinos.",
  },
  {
    id: "bumba-meu-boi",
    icon: "🐂",
    prompt: "Qual manifestação cultural maranhense mistura música, dança, teatro e personagens folclóricos?",
    options: [
      { id: "bumba-meu-boi", text: "Bumba meu boi", correct: true },
      { id: "frevo", text: "Frevo", simple: true, correct: false },
      { id: "maracatu", text: "Maracatu", correct: false },
      { id: "congado", text: "Congado", correct: false },
    ],
    fact: "O Bumba meu boi do Maranhão é uma celebração popular reconhecida como Patrimônio Cultural Imaterial da Humanidade.",
  },
  {
    id: "serra-da-capivara",
    icon: "🪨",
    prompt: "Em qual estado fica o Parque Nacional da Serra da Capivara, famoso por suas pinturas rupestres?",
    options: [
      { id: "serra-da-capivara", text: "Piauí", correct: true },
      { id: "bahia", text: "Bahia", simple: true, correct: false },
      { id: "pernambuco", text: "Pernambuco", correct: false },
      { id: "ceara", text: "Ceará", correct: false },
    ],
    fact: "A Serra da Capivara, no Piauí, reúne alguns dos mais importantes sítios arqueológicos das Américas.",
  },
];