import { Button } from "./button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/steam";

export default function ReviewsButton({ game, setGameReviews }) {
  const [loading, setLoading] = useState(false);

  const handleFetchReviews = async () => {
    if (!game?.appid) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/games/${game.appid}/reviews`);
      const data = await response.json();
      setGameReviews(data);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFetchReviews}
      disabled={loading}
      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando avaliações...
        </>
      ) : (
        "Ver Avaliações"
      )}
    </Button>
  );
}