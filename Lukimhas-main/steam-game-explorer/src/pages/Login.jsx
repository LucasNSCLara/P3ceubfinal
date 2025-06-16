import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import WaveBackground from '@/components/ui/WaveBackground'
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from '@/contexts/ThemeContext';
import { themes } from '@/lib/theme';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/steam";

export default function Login() {
  const { darkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const theme = darkMode ? themes.dark : themes.light
  const navigate = useNavigate();

  // Adicionar tema dark
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Note que agora usamos /api/login diretamente
      const res = await fetch(`${API_BASE_URL.replace("/api/steam", "")}/api/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          password 
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Credenciais inválidas");
      }
      
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate('/');
      } else {
        throw new Error("Token não recebido");
      }
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message || "Erro ao fazer login");
    }
  };

  return (
    <div className={`min-h-screen ${theme.background.gradient} transition-colors duration-700`}>
      <WaveBackground isDarkMode={darkMode} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Steam Explorer
            </h1>
            <p className={`mt-2 ${theme.text.secondary}`}>
              Sua biblioteca de jogos em um novo nível
            </p>
          </div>
          <form
            onSubmit={handleLogin}
            className={`${theme.card.background} ${theme.card.border} p-8 rounded-xl shadow-lg w-full max-w-md relative z-10`}
          >
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Bem-vindo de volta!
            </h2>
            <Input
              type="email"
              placeholder="Email"
              className={`mb-4 ${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}`}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Senha"
              className={`mb-6 ${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-400 mb-4 text-center">{error}</div>}
            <Button
              type="submit"
              className={`w-full ${theme.button.primary}`}
            >
              Entrar
            </Button>
            <div className="text-center mt-4">
              <Link
                to="/register"
                className={`${theme.text.accent} hover:underline`}
              >
                Não tem conta? Cadastre-se
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}