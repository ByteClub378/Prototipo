import { useEffect, useState } from "react";
import { apiGet } from "../../utils/api";
import "./AdminPanel.css";

type RegionId = "norte" | "nordeste" | "centro-oeste" | "sudeste" | "sul";

interface Overview {
  generatedAt: string;
  players: { total: number; whoPlayed: number; activeInPeriod: number; whoOnlyOpened: number };
  attempts: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    accuracyRate: number;
    performanceIndex: number;
    averageDurationSeconds: number;
    totalCorrectAnswers: number;
    totalIncorrectAnswers: number;
  };
}

interface RegionMetric {
  regionId: RegionId;
  name: string;
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  passRate: number;
  accuracyRate: number;
  performanceIndex: number;
}

interface TopicMetric {
  id: string;
  name: string;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswers: number;
  accuracyRate: number;
  difficultyIndex: number | null;
}

const REGIONS: { id: RegionId; name: string }[] = [
  { id: "norte", name: "Norte" },
  { id: "nordeste", name: "Nordeste" },
  { id: "centro-oeste", name: "Centro-Oeste" },
  { id: "sudeste", name: "Sudeste" },
  { id: "sul", name: "Sul" },
];

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDateString(date);
}

function filterQuery(from: string, to: string, regionId: string) {
  const params = new URLSearchParams({ from, to });
  if (regionId) params.set("regionId", regionId);
  return `?${params.toString()}`;
}

export default function AdminPanel() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(() => daysAgo(13));
  const [to, setTo] = useState(() => localDateString(new Date()));
  const [regionId, setRegionId] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [regions, setRegions] = useState<RegionMetric[]>([]);
  const [topics, setTopics] = useState<TopicMetric[]>([]);

  useEffect(() => {
    let cancelled = false;
    const query = filterQuery(from, to, regionId);

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [overviewData, regionData, topicData] = await Promise.all([
          apiGet<Overview>(`/admin/stats/overview${query}`),
          apiGet<{ regions: RegionMetric[] }>(`/admin/stats/regions${query}`),
          apiGet<{ topics: TopicMetric[] }>(`/admin/stats/topics${query}`),
        ]);
        if (cancelled) return;
        setOverview(overviewData);
        setRegions(regionData.regions);
        setTopics(topicData.topics);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Não foi possível carregar as estatísticas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();
    return () => { cancelled = true; };
  }, [from, to, regionId]);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">AVENTURA DAS REGIÕES</p>
          <h1>Painel de métricas</h1>
          <p>Acompanhamento de participação e aprendizagem.</p>
        </div>
      </header>

      <section className="admin-filters" aria-label="Filtros do painel">
        <label>De<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} /></label>
        <label>Até<input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} /></label>
        <label>
          Região
          <select value={regionId} onChange={(event) => setRegionId(event.target.value)}>
            <option value="">Todas as regiões</option>
            {REGIONS.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
          </select>
        </label>
      </section>

      {loading && <p className="admin-status" role="status">Atualizando dados...</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}

      {overview && (
        <>
          <section className="admin-cards" aria-label="Resumo do período">
            <article className="admin-card"><span>Jogadores cadastrados</span><strong>{overview.players.total}</strong></article>
            <article className="admin-card"><span>Jogadores ativos no período</span><strong>{overview.players.activeInPeriod}</strong></article>
            <article className="admin-card"><span>Tentativas</span><strong>{overview.attempts.total}</strong></article>
            <article className="admin-card"><span>Taxa de aprovação</span><strong>{overview.attempts.passRate}%</strong></article>
            <article className="admin-card"><span>Precisão das respostas</span><strong>{overview.attempts.accuracyRate}%</strong></article>
            <article className="admin-card"><span>Tempo médio por tentativa</span><strong>{Math.round(overview.attempts.averageDurationSeconds)} s</strong></article>
          </section>

          <section className="admin-section">
            <h2>Desempenho por região</h2>
            <div className="admin-table-wrap">
              <table>
                <thead><tr><th>Região</th><th>Tentativas</th><th>Aprovação</th><th>Precisão</th></tr></thead>
                <tbody>
                  {regions.map((region) => (
                    <tr key={region.regionId}>
                      <th scope="row">{region.name}</th><td>{region.totalAttempts}</td><td>{region.passRate}%</td><td>{region.accuracyRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-section">
            <h2>Aprendizagem por assunto</h2>
            <div className="admin-topic-grid">
              {topics.map((topic) => (
                <article className="admin-topic" key={topic.id}>
                  <div className="admin-topic__heading">
                    <h3>{topic.name}</h3>
                    <strong>{topic.totalAnswers > 0 ? `${topic.accuracyRate}% de acertos` : "Sem dados neste período"}</strong>
                  </div>
                  {topic.totalAnswers > 0 && <progress value={topic.accuracyRate} max={100} aria-label={`${topic.name}: ${topic.accuracyRate}% de acertos`} />}
                  <small>{topic.correctAnswers} acertos · {topic.incorrectAnswers} erros</small>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}