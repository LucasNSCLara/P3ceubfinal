import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Legend
} from "recharts";

// Paleta de gradientes e cores
const GRADIENTS = [
  "#66c0f4", // azul
  "#a259f7", // roxo
  "#ff6ec7", // rosa
  "#6dd5ed", // azul claro
  "#b993d6", // roxo claro
];

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/steam";

export default function GameStatsChart({ appId }) {
  const [achievements, setAchievements] = useState([]);
  const [reviewMetrics, setReviewMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appId) return;
    setLoading(true);

    // Fetch achievements
    fetch(`${API_BASE_URL}/games/${appId}/stats`)
      .then(res => res.json())
      .then(json => {
        setAchievements(
          (json.achievements || [])
            .sort((a, b) => b.percent - a.percent)
            .slice(0, 10)
        );
      });

    // Fetch review metrics
    fetch(`${API_BASE_URL}/games/${appId}/reviews?num_per_page=0`)
      .then(res => res.json())
      .then(json => {
        setReviewMetrics(json.query_summary || null);
      })
      .finally(() => setLoading(false));
  }, [appId]);

  if (loading) return <div className="text-center text-gray-400 py-8">Carregando estatísticas...</div>;
  if (!achievements.length && !reviewMetrics) return <div className="text-center text-gray-400 py-8">Sem estatísticas disponíveis.</div>;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Gráfico de conquistas */}
      <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-4 shadow-lg">
        <h4 className="text-lg font-bold mb-4 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Top 10 Conquistas Globais
        </h4>
        {achievements.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={achievements} layout="vertical" margin={{ left: 60, right: 20, top: 10, bottom: 10 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#c7d5e0" }} />
              <YAxis
                dataKey="displayName"
                type="category"
                width={180}
                tick={{ fill: "#c7d5e0", fontSize: 13 }}
              />
              <Tooltip
                cursor={{ fill: "#a259f733" }}
                contentStyle={{ background: "#1b2838", border: "none", color: "#c7d5e0" }}
                formatter={(value, name, props) => [`${value}%`, "Percentual"]}
                labelFormatter={(label, payload) => {
                  const ach = achievements.find(a => a.displayName === label);
                  return (
                    <div>
                      <strong>{ach?.displayName}</strong>
                      <br />
                      {ach?.description && <span className="text-xs">{ach.description}</span>}
                      <br />
                      {ach?.icon && <img src={ach.icon} alt="" style={{ width: 32, marginTop: 4 }} />}
                    </div>
                  );
                }}
              />
              <Bar dataKey="percent" radius={[8, 8, 8, 8]}>
                {achievements.map((entry, idx) => (
                  <Cell key={entry.name} fill={GRADIENTS[idx % GRADIENTS.length]} />
                ))}
                <LabelList dataKey="percent" position="right" formatter={(v) => `${v}%`} fill="#fff" fontWeight={700} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-400 py-8">Sem conquistas disponíveis.</div>
        )}
      </div>

      {/* Gráficos de avaliações */}
      <div className="flex flex-col gap-8">
        {/* Barras de avaliações */}
        <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-4 shadow-lg">
          <h4 className="text-lg font-bold mb-4 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Avaliações da Comunidade
          </h4>
          {reviewMetrics ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { name: "Positivas", value: reviewMetrics.total_positive, color: "#66c0f4" },
                { name: "Negativas", value: reviewMetrics.total_negative, color: "#ff6ec7" }
              ]}>
                <XAxis dataKey="name" tick={{ fill: "#c7d5e0" }} />
                <YAxis tick={{ fill: "#c7d5e0" }} />
                <Tooltip
                  contentStyle={{ background: "#1b2838", border: "none", color: "#c7d5e0" }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Bar dataKey="value">
                  <Cell fill="#66c0f4" />
                  <Cell fill="#ff6ec7" />
                  <LabelList dataKey="value" position="top" fill="#fff" fontWeight={700} formatter={v => v.toLocaleString()} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-400 py-8">Sem dados de avaliações.</div>
          )}
        </div>
        {/* Score geral em pizza */}
        <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-4 shadow-lg">
          <h4 className="text-lg font-bold mb-4 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Score Geral
          </h4>
          {reviewMetrics ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: reviewMetrics.review_score_desc, value: reviewMetrics.total_positive, fill: "#66c0f4" },
                    { name: "Negativas", value: reviewMetrics.total_negative, fill: "#ff6ec7" }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-400 py-8">Sem dados de score.</div>
          )}
        </div>
      </div>
    </div>
  );
}