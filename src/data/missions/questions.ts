export type SoutheastStateId = "sao-paulo" | "minas-gerais" | "rio-de-janeiro" | "espirito-santo";

export interface SoutheastQuestion {
  id: number;
  bloom: "Lembrar" | "Compreender" | "Aplicar";
  prompt: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
}

export interface SoutheastState {
  id: SoutheastStateId;
  name: string;
  abbreviation: "SP" | "MG" | "RJ" | "ES";
  icon: string;
  path: string;
  label: { x: number; y: number };
  questions: SoutheastQuestion[];
}

// O desenho é uma representação didática, com os quatro estados separados e
// clicáveis. O SVG está disponível em assets/sudeste-estados.svg.
export const SOUTHEAST_STATES: SoutheastState[] = [
  {
    id: "sao-paulo", name: "São Paulo", abbreviation: "SP", icon: "🏙️",
    path: "M88 112 L101 144 L126 154 L142 181 L170 185 L196 207 L222 188 L254 199 L279 203 L304 221 L334 230 L350 211 L374 213 L359 245 L335 271 L302 288 L262 286 L232 318 L193 338 L151 330 L121 313 L99 284 L82 253 L88 224 L65 207 L74 177 L67 148 Z",
    label: { x: 175, y: 265 },
    questions: [
      { id: 3, bloom: "Lembrar", prompt: "Qual destas cidades é uma grande metrópole do Sudeste?", options: ["São Paulo", "Manaus", "Recife", "Goiânia"], answerIndex: 0, explanation: "São Paulo é uma das maiores metrópoles brasileiras e fica no estado de São Paulo." },
      { id: 4, bloom: "Lembrar", prompt: "No Sudeste, a maior parte da população vive em:", options: ["Comunidades de pesca isoladas", "Aldeias indígenas", "Áreas urbanas", "Fazendas"], answerIndex: 2, explanation: "A população do Sudeste é majoritariamente urbana e se concentra em cidades." },
      { id: 16, bloom: "Compreender", prompt: "Muitos moradores de municípios próximos viajam diariamente para trabalhar na capital. Isso mostra:", options: ["Que todos trabalham na agricultura", "Que as cidades não se relacionam", "Que existem ligações entre as cidades por trabalho e serviços", "Que só é possível trabalhar no bairro onde se mora"], answerIndex: 2, explanation: "As cidades se conectam por deslocamentos de pessoas, trabalho e serviços." },
      { id: 19, bloom: "Compreender", prompt: "Na paisagem de uma grande cidade do Sudeste, qual elemento foi construído pelas pessoas?", options: ["Viaduto", "Montanha", "Rio", "Cachoeira"], answerIndex: 0, explanation: "O viaduto é uma construção humana; montanhas, rios e cachoeiras são elementos naturais." },
      { id: 20, bloom: "Compreender", prompt: "Hortaliças produzidas no campo são vendidas em mercados das cidades. Esse exemplo mostra:", options: ["Que os alimentos são produzidos somente nas cidades", "Que o campo não participa da economia", "Que o campo e a cidade estão conectados", "Que os mercados não precisam de transporte"], answerIndex: 2, explanation: "O campo produz alimentos que são transportados e vendidos nas cidades." },
    ],
  },
  {
    id: "minas-gerais", name: "Minas Gerais", abbreviation: "MG", icon: "⛰️",
    path: "M105 58 C135 42 180 45 211 55 L256 42 L302 59 L328 82 L315 112 L292 137 L305 160 L278 180 L254 199 L222 188 L196 207 L170 185 L142 181 L126 154 L101 144 L88 112 L92 82 Z",
    label: { x: 207, y: 124 },
    questions: [
      { id: 1, bloom: "Lembrar", prompt: "Qual destes estados pertence à Região Sudeste?", options: ["Maranhão", "Minas Gerais", "Rondônia", "Rio Grande do Sul"], answerIndex: 1, explanation: "Minas Gerais é um dos quatro estados da Região Sudeste." },
      { id: 7, bloom: "Compreender", prompt: "Por que algumas cidades serranas do Sudeste são mais frias que cidades próximas ao litoral?", options: ["Porque estão em maiores altitudes", "Porque não recebem luz do Sol", "Porque ficam fora do Brasil", "Porque não possuem vegetação"], answerIndex: 0, explanation: "Em geral, temperaturas diminuem em lugares de maior altitude." },
      { id: 9, bloom: "Lembrar", prompt: "Qual atividade econômica tem forte ligação com a história e a economia de Minas Gerais?", options: ["Extração de sal marinho", "Mineração", "Pesca oceânica", "Cultivo de algas"], answerIndex: 1, explanation: "A mineração marcou a história de Minas Gerais e continua importante para sua economia." },
      { id: 11, bloom: "Compreender", prompt: "Uma pessoa que trabalha em uma loja de Belo Horizonte atua principalmente em qual atividade?", options: ["Comércio", "Pecuária", "Mineração", "Agricultura"], answerIndex: 0, explanation: "A venda de produtos em lojas faz parte do comércio." },
      { id: 12, bloom: "Lembrar", prompt: "Qual alimento é especialmente associado à culinária de Minas Gerais?", options: ["Acarajé", "Tacacá", "Pão de queijo", "Barreado"], answerIndex: 2, explanation: "O pão de queijo é um dos alimentos mais conhecidos da culinária mineira." },
      { id: 17, bloom: "Compreender", prompt: "Qual atividade está ligada à visitação de cidades históricas, como Ouro Preto?", options: ["Pesca industrial", "Turismo cultural", "Extração de sal", "Cultivo de soja"], answerIndex: 1, explanation: "Visitar patrimônios, museus e centros históricos é uma forma de turismo cultural." },
    ],
  },
  {
    id: "rio-de-janeiro", name: "Rio de Janeiro", abbreviation: "RJ", icon: "🌊",
    path: "M305 160 L331 177 L349 158 L366 172 L389 193 L374 213 L350 211 L334 230 L304 221 L279 203 L254 199 L278 180 Z",
    label: { x: 335, y: 197 },
    questions: [
      { id: 2, bloom: "Lembrar", prompt: "Qual região brasileira reúne o maior número de habitantes?", options: ["Norte", "Sul", "Centro-Oeste", "Sudeste"], answerIndex: 3, explanation: "O Sudeste é a região brasileira mais populosa." },
      { id: 5, bloom: "Lembrar", prompt: "Qual vegetação nativa está presente em trechos do litoral e das serras do Sudeste?", options: ["Pampa", "Mata Atlântica", "Vegetação de regiões geladas", "Floresta Amazônica"], answerIndex: 1, explanation: "A Mata Atlântica ocorre em áreas do litoral e das serras do Sudeste." },
      { id: 8, bloom: "Compreender", prompt: "Qual atividade transforma matérias-primas em carros, roupas e outros produtos?", options: ["Pesca", "Agricultura", "Indústria", "Extrativismo vegetal"], answerIndex: 2, explanation: "A indústria transforma matérias-primas em produtos." },
      { id: 13, bloom: "Lembrar", prompt: "Qual festa do Rio de Janeiro é conhecida pelos desfiles de escolas de samba?", options: ["Festa da Uva", "Carnaval", "Festival de Parintins", "Festa do Pequi"], answerIndex: 1, explanation: "O Carnaval do Rio de Janeiro é conhecido pelos desfiles das escolas de samba." },
      { id: 15, bloom: "Compreender", prompt: "A contribuição de diferentes regiões e países para a população do Sudeste favoreceu:", options: ["A diversidade de comidas, festas e costumes", "A existência de uma única tradição", "A ausência de influências culturais", "O uso de uma única receita em todas as famílias"], answerIndex: 0, explanation: "Diferentes povos e migrações contribuem para a diversidade cultural da região." },
    ],
  },
  {
    id: "espirito-santo", name: "Espírito Santo", abbreviation: "ES", icon: "☀️",
    path: "M302 59 L336 70 L357 95 L365 127 L349 158 L331 177 L305 160 L292 137 L315 112 L328 82 Z",
    label: { x: 337, y: 111 },
    questions: [
      { id: 6, bloom: "Aplicar", prompt: "Uma família visitará uma cidade serrana do Sudeste com previsão de frio. O que deve incluir na bagagem?", options: ["Apenas roupas de banho", "Somente bermudas e chinelos", "Apenas camisetas sem mangas", "Agasalhos adequados à temperatura"], answerIndex: 3, explanation: "Agasalhos ajudam a manter o corpo aquecido quando a previsão indica frio." },
      { id: 10, bloom: "Lembrar", prompt: "Qual produto agrícola tem grande importância em Minas Gerais, Espírito Santo e São Paulo?", options: ["Tâmara", "Azeitona", "Trigo-sarraceno", "Café"], answerIndex: 3, explanation: "O café é uma cultura importante nesses três estados do Sudeste." },
      { id: 14, bloom: "Lembrar", prompt: "A moqueca capixaba é um prato tradicional de qual estado?", options: ["São Paulo", "Minas Gerais", "Rio de Janeiro", "Espírito Santo"], answerIndex: 3, explanation: "A moqueca capixaba é uma receita tradicional do Espírito Santo." },
      { id: 18, bloom: "Aplicar", prompt: "Uma fábrica quer diminuir a poluição de um rio. Qual medida deve adotar?", options: ["Despejar resíduos apenas durante a noite", "Jogar os resíduos em um rio vizinho", "Misturar lixo sólido à água usada", "Tratar a água utilizada antes de devolvê-la ao ambiente"], answerIndex: 3, explanation: "O tratamento reduz a poluição antes que a água seja devolvida ao ambiente." },
    ],
  },
];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

/** Sorteia duas perguntas diferentes por estado a cada montagem da fase. */
export function createQuestionSelection(): Record<SoutheastStateId, SoutheastQuestion[]> {
  return Object.fromEntries(
    SOUTHEAST_STATES.map((state) => [state.id, shuffle(state.questions).slice(0, 2)]),
  ) as Record<SoutheastStateId, SoutheastQuestion[]>;
}
