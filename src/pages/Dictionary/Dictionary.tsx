import { useMemo, useState } from "react";
import {
  terms,
  type DictionaryEntry,
  type Category,
  type Region,
} from "../../data/dictionary/terms";
import SpellingAnimation from "./SpellingAnimation";
import "./Dictionary.css";

const regions: Array<Region | "Todas"> = [
  "Todas",
  "Norte",
  "Nordeste",
  "Centro-Oeste",
  "Sudeste",
  "Sul",
];

const categories: Array<Category | "Todas"> = [
  "Todas",
  "Natureza",
  "Cultura",
  "Culinária",
  "Geografia",
];

function Dictionary() {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] =
    useState<Region | "Todas">("Todas");
  const [selectedCategory, setSelectedCategory] =
    useState<Category | "Todas">("Todas");
  const [selectedTerm, setSelectedTerm] = useState<DictionaryEntry | null>(null);

  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const filteredTerms = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return terms.filter((term) => {
      const matchesSearch =
        term.word.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        term.definition.toLocaleLowerCase("pt-BR").includes(normalizedSearch);

      const matchesRegion =
        selectedRegion === "Todas" || term.region === selectedRegion;

      const matchesCategory =
        selectedCategory === "Todas" || term.category === selectedCategory;

      return matchesSearch && matchesRegion && matchesCategory;
    });
  }, [search, selectedRegion, selectedCategory]);

  const quizTerm = terms[quizIndex % terms.length];

  const quizOptions = useMemo(() => {
    const distractors = terms
      .filter((term) => term.id !== quizTerm.id)
      .slice(quizIndex % 5, (quizIndex % 5) + 3)
      .map((term) => term.word);

    return [...distractors, quizTerm.word].sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  }, [quizTerm, quizIndex]);

  function handleAnswer(answer: string) {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
  }

  function nextQuestion() {
    setQuizIndex((current) => current + 1);
    setSelectedAnswer(null);
  }

  return (
    <main className="dictionary-page">
      <header className="dictionary-header">
        <p className="dictionary-eyebrow">Aventura das Regiões do Brasil</p>
        <h1>Dicionário da aventura</h1>
        <p>
          Explore palavras, descubra seus significados e conheça um pouco mais
          sobre cada região.
        </p>
      </header>

      <section className="dictionary-controls" aria-label="Filtros do dicionário">
        <label className="dictionary-search">
          <span>Buscar palavra</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex.: bioma, frevo, Pantanal..."
          />
        </label>

        <label>
          <span>Região</span>
          <select
            value={selectedRegion}
            onChange={(event) =>
              setSelectedRegion(event.target.value as Region | "Todas")
            }
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Assunto</span>
          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.target.value as Category | "Todas")
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="dictionary-results-heading">
        <h2>Palavras para descobrir</h2>
        <span>{filteredTerms.length} palavras</span>
      </div>

      {filteredTerms.length > 0 ? (
        <section className="dictionary-grid" aria-label="Palavras encontradas">
          {filteredTerms.map((term) => (
            <article className="dictionary-card" key={term.id}>
              <div className="dictionary-card-tags">
                <span>{term.region}</span>
                <span>{term.category}</span>
              </div>
              <h3>{term.word}</h3>
              <p>{term.definition}</p>
              <div className="dictionary-example">
                <strong>Exemplo:</strong> {term.example}
              </div>
              <button
                className="dictionary-button"
                type="button"
                aria-haspopup="dialog"
                onClick={() => setSelectedTerm(term)}
              >
                Ver em Libras
              </button>
            </article>
          ))}
        </section>
      ) : (
        <p className="dictionary-empty">
          Não encontramos palavras com esses filtros. Tente outra busca.
        </p>
      )}

      <section className="dictionary-challenge">
        <div>
          <p className="dictionary-eyebrow">Desafio rápido</p>
          <h2>Descubra a palavra</h2>
          <p>
            Leia a definição e escolha qual palavra combina com ela.
          </p>
        </div>

        {!showQuiz ? (
          <button
            className="dictionary-button"
            type="button"
            onClick={() => setShowQuiz(true)}
          >
            Começar desafio
          </button>
        ) : (
          <div className="dictionary-quiz">
            <p className="dictionary-question">{quizTerm.definition}</p>

            <div className="dictionary-options">
              {quizOptions.map((option) => {
                const isCorrect = option === quizTerm.word;
                const isSelected = option === selectedAnswer;

                let className = "dictionary-option";
                if (selectedAnswer && isCorrect) {
                  className += " is-correct";
                } else if (isSelected && !isCorrect) {
                  className += " is-incorrect";
                }

                return (
                  <button
                    className={className}
                    type="button"
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={Boolean(selectedAnswer)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {selectedAnswer && (
              <div className="dictionary-feedback" role="status">
                <p>
                  {selectedAnswer === quizTerm.word
                    ? "Muito bem! Você acertou."
                    : `Quase! A resposta certa é ${quizTerm.word}.`}
                </p>
                <button
                  className="dictionary-button"
                  type="button"
                  onClick={nextQuestion}
                >
                  Próxima palavra
                </button>
              </div>
            )}
          </div>
        )}
      </section>
      {selectedTerm && (
        <div
          className="dictionary-modal-backdrop"
          onClick={() => setSelectedTerm(null)}
        >
          <section
            className="dictionary-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dictionary-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="dictionary-modal-close"
              type="button"
              aria-label="Fechar"
              onClick={() => setSelectedTerm(null)}
            >
              ×
            </button>

            <h2 id="dictionary-modal-title">{selectedTerm.word}</h2>
            <SpellingAnimation word={selectedTerm.word} />
          </section>
        </div>
      )}
    </main>
  );
}

export default Dictionary;