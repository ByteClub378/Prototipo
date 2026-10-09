import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";

import { useProgress } from "../../context/ProgressContext";
import { useSession } from "../../context/SessionContext";
import { REGIONS } from "../../data/regions/regions";

import "./Medals.css";

type Filter = "all" | "earned" | "pending";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "earned", label: "Conquistadas" },
  { id: "pending", label: "A conquistar" },
];

export default function Medals() {
  const { getStatus } = useProgress();
  const { gameState } = useSession();
  const [filter, setFilter] = useState<Filter>("all");
  const awardedRegionIds = new Set(
    gameState?.medals.map((medal) => medal.regionId) ?? [],
  );

  const medals = REGIONS.map((region) => {
    const status = getStatus(region.id);

    return {
      ...region,
      earned: awardedRegionIds.has(region.id),
      available: status === "unlocked" && region.id !== "sul",
    };
  });

  const earnedCount = medals.filter((medal) => medal.earned).length;

  const visibleMedals = medals.filter((medal) => {
    if (filter === "earned") return medal.earned;
    if (filter === "pending") return !medal.earned;
    return true;
  });

  return (
    <section className="medals-page" aria-labelledby="medals-title">
      <header className="medals-page__header">
        <span className="medals-page__trophy" aria-hidden="true">
          🏆
        </span>

        <div>
          <p className="medals-page__eyebrow">
            MEU ÁLBUM DE AVENTURAS
          </p>

          <h1 id="medals-title">Medalhas do Conhecimento</h1>

          <p>
            Explore o Brasil e complete sua coleção,
            uma região de cada vez!
          </p>
        </div>
      </header>

      <section
        className="medals-page__collection"
        aria-labelledby="collection-title"
      >
        <div className="medals-page__summary">
          <h2 id="collection-title">
            {earnedCount} de {medals.length} medalhas conquistadas
          </h2>

          <span aria-hidden="true">
            {earnedCount === medals.length ? "🎉" : "🧭"}
          </span>
        </div>

        <progress
          value={earnedCount}
          max={medals.length}
          aria-label="Progresso da coleção de medalhas"
        />

        <p>
          {earnedCount === medals.length
            ? "Coleção completa! Você explorou as cinco regiões!"
            : "Cada nova descoberta aproxima você da próxima medalha."}
        </p>
      </section>

      <div
        className="medals-page__filters"
        role="group"
        aria-label="Filtrar medalhas"
      >
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section
        className="medals-page__grid"
        aria-label="Galeria de medalhas"
      >
        {visibleMedals.map((medal) => (
          <article
            key={medal.id}
            className={`medal-card ${
              medal.earned ? "is-earned" : "is-pending"
            }`}
            style={{ "--medal-color": medal.color } as CSSProperties}
          >
            <div className="medal-card__badge" aria-hidden="true">
              <span>{medal.icon}</span>
              <small>{medal.earned ? "★" : "🔒"}</small>
            </div>

            <span
              className={`medal-card__status ${
                medal.earned ? "is-earned" : ""
              }`}
            >
              {medal.earned
                ? "✓ Conquistada"
                : medal.id === "sul"
                  ? "Em desenvolvimento"
                  : medal.available
                    ? "Pronta para conquistar"
                    : "Ainda bloqueada"}
            </span>

            <h2>Medalha do {medal.name}</h2>

            <p>
              {medal.earned
                ? `Sua aventura pelo ${medal.name} ganhou um lugar especial nesta coleção!`
                : `Conclua os desafios da região ${medal.name} para conquistar esta medalha.`}
            </p>

            {medal.earned ? (
              <Link to="/mapa">Continuar aventura</Link>
            ) : medal.available ? (
              <Link to={`/missao/${medal.id}`}>
                Explorar região
              </Link>
            ) : (
              <span className="medal-card__locked">
                {medal.id === "sul"
                  ? "Novas aventuras em breve"
                  : "Complete as regiões anteriores"}
              </span>
            )}
          </article>
        ))}
      </section>

      {visibleMedals.length === 0 && (
        <p className="medals-page__empty" role="status">
          {filter === "earned"
            ? "Sua primeira medalha está esperando por você! Comece pelo Norte."
            : "Você já conquistou todas as medalhas!"}
        </p>
      )}
    </section>
  );
}
