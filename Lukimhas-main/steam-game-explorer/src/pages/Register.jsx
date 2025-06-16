import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WaveBackground from "@/components/ui/WaveBackground";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from '@/contexts/ThemeContext';
import { themes } from '@/lib/theme';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/steam";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const theme = darkMode ? themes.dark : themes.light;

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE_URL.replace("/api/steam", "")}/api/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          username: name,
          email, 
          password 
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao cadastrar");
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Erro ao conectar com o servidor");
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
              Explore. Descubra. Jogue.
            </p>
          </div>
          <form
            onSubmit={handleRegister}
            className={`${theme.card.background} ${theme.card.border} p-8 rounded-xl shadow-lg w-full max-w-md relative z-10`}
          >
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Crie sua conta
            </h2>
            <Input
              type="text"
              placeholder="Nome"
              className={`mb-4 ${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}`}
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
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
            {success && (
              <div className="text-green-400 mb-4 text-center">
                Cadastro realizado!{" "}
                <Link to="/login" className="underline">
                  Entrar
                </Link>
              </div>
            )}
            <Button
              type="submit"
              className={`w-full ${theme.button.primary}`}
            >
              Cadastrar
            </Button>
            <div className="text-center mt-4">
              <Link
                to="/login"
                className={`${theme.text.accent} hover:underline`}
              >
                Já tem conta? Entrar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}