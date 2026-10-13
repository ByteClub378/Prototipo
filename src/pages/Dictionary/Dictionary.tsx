import { useMemo, useState } from "react";
import { REGIONS } from "../../data/regions/regions";
import {
  DICTIONARY_ENTRIES,
  type DictionaryCategory,
  type DictionaryEntry,
} from "../../data/dictionary/terms";
import "./Dictionary.css";

type CategoryFilter = "todas" | DictionaryCategory;
type RegionFilter = "todas" | DictionaryEntry["regionId"];

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "natureza", label: "Natureza" },
  { id: "geografia", label: "Geografia" },
  { id: "cultura", label: "Cultura" },
  { id: "culinaria", label: "Culinária" },
];

const CATEGORY_LABELS: Record<DictionaryCategory, string> = {
  natureza: "Natureza",
  geografia: "Geografia",
  cultura: "Cultura",
  culinaria: "Culinária",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function createChallenge(): { answer: DictionaryEntry; options: DictionaryEntry[] } {
  const answer = DICTIONARY_ENTRIES[Math.floor(Math.random() * DICTIONARY_ENTRIES.length)];
  const alternatives = shuffled(DICTIONARY_ENTRIES.filter((entry) => entry.id !== answer.id)).slice(0, 3);
  return { answer, options: shuffled([answer, ...alternatives]) };
}

function Dictionary() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("todas");
  const [region, setRegion] = useState<RegionFilter>("todas");
  const [challenge, setChallenge] = useState(createChallenge);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const visibleEntries = useMemo(() => {
    const query = normalizeText(search);
    return DICTIONARY_ENTRIES.filter((entry) => {
      const matchesQuery =
        !query ||
        normalizeText(entry.term).includes(query) ||
        normalizeText(entry.definition).includes(query) ||
        normalizeText(entry.example).includes(query);
      const matchesCategory = category === "todas" || entry.category === category;
      const matchesRegion = region === "todas" || entry.regionId === region;
      return matchesQuery && matchesCategory && matchesRegion;
    });
  }, [search, category, region]);

  const selectedIsCorrect = selectedAnswer === challenge.answer.id;

  function answerChallenge(entryId: string) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(entryId);
  }

  function nextChallenge() {
    setChallenge(createChallenge());
    setSelectedAnswer(null);
  }

  return (
    <main className="dictionary-page" aria-labelledby="dictionary-title">
      <header className="dictionary-page__header">
        <div className="dictionary-page__icon" aria-hidden="true">📖</div>
        <div>
          <p className="dictionary-page__eyebrow">CADERNO DE DESCOBERTAS</p>
          <h1 id="dictionary-title">Dicionário da Aventura</h1>
          <p className="dictionary-page__intro">
            Descubra palavras que aparecem nas missões e aprenda o que elas significam.
          </p>
        </div>
      </header>

      <section aria-label="Buscar e filtrar palavras">
        <div className="dictionary-page__toolbar">
          <label className="dictionary-page__search">
            <span aria-hidden="true">🔎</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar uma palavra ou significado"
              aria-label="Buscar uma palavra ou significado"
            />
          </label>

          <label className="dictionary-page__region">
            <span aria-hidden="true">🗺️</span>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value as RegionFilter)}
              aria-label="Filtrar por região"
            >
              <option value="todas">Todas as regiões</option>
              {REGIONS.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="dictionary-page__categories" role="group" aria-label="Filtrar por assunto">
          {CATEGORY_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="dictionary-page__content">
        <section aria-labelledby="dictionary-results-title">
          <div className="dictionary-page__results-header">
            <h2 id="dictionary-results-title">Palavras para explorar</h2>
            <p aria-live="polite">{visibleEntries.length} palavras encontradas</p>
          </div>

          {visibleEntries.length > 0 ? (
            <div className="dictionary-page__grid">
              {visibleEntries.map((entry) => {
                const entryRegion = REGIONS.find((item) => item.id === entry.regionId);
                return (
                  <article className="dictionary-card" key={entry.id}>
                    <div className="dictionary-card__top">
                      <span className="dictionary-card__icon" aria-hidden="true">{entry.icon}</span>
                      <span className="dictionary-card__region">{entryRegion?.name}</span>
                    </div>
                    <p className="dictionary-card__category">{CATEGORY_LABELS[entry.category]}</p>
                    <h3>{entry.term}</h3>
                    <p className="dictionary-card__definition">{entry.definition}</p>
                    <details>
                      <summary>Ver exemplo</summary>
                      <p>{entry.example}</p>
                    </details>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dictionary-empty" role="status">
              <span aria-hidden="true">🧭</span>
              <h3>Nenhuma palavra encontrada</h3>
              <p>Tente outra busca ou escolha um filtro diferente.</p>
            </div>
          )}
        </section>

        <aside className="dictionary-quiz" aria-labelledby="dictionary-quiz-title">
          <p className="dictionary-quiz__eyebrow">DESAFIO RELÂMPAGO</p>
          <h2 id="dictionary-quiz-title">O que significa?</h2>
          <p className="dictionary-quiz__prompt">
            Qual destas palavras combina com esta explicação?
          </p>
          <blockquote>{challenge.answer.definition}</blockquote>

          <div className="dictionary-quiz__options" role="group" aria-label="Opções de resposta">
            {challenge.options.map((option) => {
              const isSelected = selectedAnswer === option.id;
              const isAnswer = selectedAnswer !== null && option.id === challenge.answer.id;
              const stateClass = isSelected
                ? selectedIsCorrect ? "is-correct" : "is-wrong"
                : isAnswer ? "is-answer" : "";
              return (
                <button
                  className={`dictionary-quiz__option ${stateClass}`}
                  key={option.id}
                  type="button"
                  disabled={selectedAnswer !== null}
                  onClick={() => answerChallenge(option.id)}
                >
                  {option.term}
                </button>
              );
            })}
          </div>

          <p className="dictionary-quiz__feedback" role="status" aria-live="polite">
            {selectedAnswer === null
              ? "Escolha uma resposta para conferir."
              : selectedIsCorrect
                ? `Isso! ${challenge.answer.example}`
                : `Quase! A resposta é ${challenge.answer.term}. ${challenge.answer.example}`}
          </p>

          <button className="dictionary-quiz__next" type="button" onClick={nextChallenge}>
            Novo desafio
          </button>
        </aside>
      </div>
    </main>
  );
}

export default Dictionary;
