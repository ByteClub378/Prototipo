import database from "./nordesteQuestions.json";

const localImages: Record<string, string> = {
  caatinga: new URL("../../assets/nordeste/Catinga.png", import.meta.url).href,
  "sao-francisco": new URL("../../assets/nordeste/rio-sao-francisco.png", import.meta.url).href,
  nove: new URL("../../assets/nordeste/mapa-nordeste.png", import.meta.url).href,
  maranhao: new URL("../../assets/nordeste/lencois-maranhenses.png", import.meta.url).href,
  "serra-capivara": new URL("../../assets/nordeste/serra-da-capivara.png", import.meta.url).href,
  acaraje: new URL("../../assets/nordeste/acaraje.png", import.meta.url).href,
  tapioca: new URL("../../assets/nordeste/tapioca.png", import.meta.url).href,
  "baiao-dois": new URL("../../assets/nordeste/baiao-de-dois.jpg", import.meta.url).href,
  "bolo-rolo": new URL("../../assets/nordeste/bolo-de-rolo.png", import.meta.url).href,
  "carne-sol": new URL("../../assets/nordeste/carne-de-sol.jpg", import.meta.url).href,
  "cabeca-cuia": new URL("../../assets/nordeste/cabeca-de-cuia.png", import.meta.url).href,
  "comadre-fulozinha": new URL("../../assets/nordeste/comadre-fulozinha.jpg", import.meta.url).href,
  "papa-figo": new URL("../../assets/nordeste/papa-figo.jpg", import.meta.url).href,
  "caboclo-agua": new URL("../../assets/nordeste/caboclo-dagua.jpg", import.meta.url).href,
  quibungo: new URL("../../assets/nordeste/quibugo.jpg", import.meta.url).href,
  "tatu-bola": new URL("../../assets/nordeste/tatu-bola.jpg", import.meta.url).href,
  "arara-lear": new URL("../../assets/nordeste/Blu (1).jpg", import.meta.url).href,
  soldadinho: new URL("../../assets/nordeste/soldadinho-do-araripe.jpg", import.meta.url).href,
  "peixe-boi": new URL("../../assets/nordeste/peixe-boi-marinho.jpg", import.meta.url).href,
  "asa-branca": new URL("../../assets/nordeste/asa-branca.jpg", import.meta.url).href,
};

export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
  simple?: boolean;
  image?: string;
}

export interface QuizQuestion {
  id: string;
  category: "Geografia" | "Culinária" | "Lendas" | "Fauna";
  state: string;
  icon: string;
  prompt: string;
  options: QuizOption[];
  fact: string;
}

export const NORDESTE_QUESTIONS = database.questions.map((question) => ({
  ...question,
  options: question.options.map((option) => ({
    ...option,
    image: localImages[option.id] ?? option.image,
  })),
})) as QuizQuestion[];
