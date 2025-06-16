import { useState, useEffect } from 'react'
import { Search, Star, Users, Calendar, ExternalLink, MessageSquare, TrendingUp, Gamepad2 } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'
import GameStatsChart from "@/components/ui/GameStatsChart";
import { useNavigate } from 'react-router-dom'
import WaveBackground from '@/components/ui/WaveBackground'
import { useTheme } from '@/contexts/ThemeContext'
import { themes } from '@/lib/theme'
import GameSpecs from '@/components/ui/GameSpecs'  // Add this line

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/steam";

function App() {
  const { darkMode, setDarkMode } = useTheme();
  const theme = darkMode ? themes.dark : themes.light;
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [gameDetails, setGameDetails] = useState(null)
  const [gameReviews, setGameReviews] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const searchGames = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/games/search?q=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Buscar detalhes de cada jogo para obter as imagens
      const gamesWithDetails = await Promise.all(
        data.games.map(async (game) => {
          try {
            const detailsResponse = await fetch(`${API_BASE_URL}/games/${game.appid}/details`);
            const details = await detailsResponse.json();
            return {
              ...game,
              header_image: details.header_image
            };
          } catch (error) {
            console.error(`Erro ao buscar detalhes do jogo ${game.appid}:`, error);
            return game;
          }
        })
      );
      
      setSearchResults(gamesWithDetails || []);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      alert('Erro ao buscar jogos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const selectGame = async (game) => {
    setSelectedGame(game)
    setLoading(true)
    
    try {
      // Buscar detalhes do jogo
      const detailsResponse = await fetch(`${API_BASE_URL}/games/${game.appid}/details`)
      const details = await detailsResponse.json()
      console.log('Game Details:', details) // Adicione esta linha
      setGameDetails(details)

      // Buscar avaliações do jogo
      const reviewsResponse = await fetch(`${API_BASE_URL}/games/${game.appid}/reviews?num_per_page=10`)
      const reviews = await reviewsResponse.json()
      setGameReviews(reviews)
    } catch (error) {
      console.error('Erro ao buscar detalhes do jogo:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR')
  }

  const formatPlaytime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    return hours > 0 ? `${hours}h` : `${minutes}min`
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className={`min-h-screen ${theme.background.gradient} transition-colors duration-700`}>
      <WaveBackground isDarkMode={darkMode} />
      
      {/* Header atualizado */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        darkMode
          ? 'border-b border-purple-500/10 bg-gray-950/10 backdrop-blur-sm'
          : 'border-b border-white/20 bg-white/10 backdrop-blur-[2px]'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Gamepad2 
                className={`h-6 w-6 ${
                  darkMode ? 'text-purple-400' : 'text-[#EEAECA]'
                }`}
              />
              <h1 className={`text-2xl font-bold bg-gradient-to-r ${
                darkMode
                  ? 'from-purple-400 to-purple-600'
                  : 'from-[#EEAECA] to-[#94BBE9]'
              } bg-clip-text text-transparent`}>
                Steam Game Explorer
              </h1>
            </motion.div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className={`transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-950/20 hover:bg-gray-900/30 text-purple-300 border-purple-500/20'
                    : 'bg-white/20 hover:bg-white/30 text-gray-800 border-white/20'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={`transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-950/20 hover:bg-gray-900/30 text-purple-300 border-purple-500/20'
                    : 'bg-white/20 hover:bg-white/30 text-gray-800 border-white/20'
                }`}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Container principal com z-index maior que as waves */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Search Section */}
        <motion.div 
          className="max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Descubra Jogos Incríveis
            </h2>
            <p className={`text-lg ${theme.text.secondary}`}>
              Explore avaliações, métricas e comentários da comunidade Steam
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Digite o nome do jogo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchGames()}
              className={`${theme.input.background} ${theme.input.border} ${theme.input.text} ${theme.input.placeholder}`}
            />
            <Button 
              onClick={searchGames} 
              disabled={loading}
              className={theme.button.primary}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className={`text-2xl font-bold mb-6 text-center ${theme.text.primary}`}>Resultados da Busca</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {searchResults.slice(0, 12).map((game, index) => (
                <motion.div
                  key={game.appid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className={`${theme.card.background} ${theme.card.border} ${theme.card.hover} transition-all duration-300 cursor-pointer hover:scale-105 overflow-hidden`}
                    onClick={() => selectGame(game)}
                  >
                    {game.header_image && (
                      <div className="w-full h-32">
                        <img 
                          src={game.header_image} 
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h4 className={`font-semibold ${theme.text.primary} truncate`}>{game.name}</h4>
                      <p className={`text-sm ${theme.text.muted}`}>App ID: {game.appid}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Game Details */}
        <AnimatePresence>
          {selectedGame && gameDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-6xl mx-auto"
            >
              <Card className="bg-white/5 border-white/10 overflow-hidden">
                <div className="relative">
                  {gameDetails.header_image && (
                    <img 
                      src={gameDetails.header_image} 
                      alt={gameDetails.name}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-3xl font-bold text-white mb-2">{gameDetails.name}</h2>
                    <div className="flex flex-wrap gap-2">
                      {gameDetails.genres?.slice(0, 3).map((genre) => (
                        <Badge key={genre.id} variant="secondary" className="bg-purple-500/20 text-purple-200">
                          {genre.description}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-white/10">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500">Visão Geral</TabsTrigger>
                      <TabsTrigger value="reviews" className="data-[state=active]:bg-purple-500">Avaliações</TabsTrigger>
                      <TabsTrigger value="stats" className="data-[state=active]:bg-purple-500">Estatísticas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <h3 className="text-xl font-semibold mb-3">Descrição</h3>
                          <p className="text-gray-300 leading-relaxed">
                            {gameDetails.description || 'Descrição não disponível.'}
                          </p>
                          
                          {gameDetails.developers && (
                            <div className="mt-4">
                              <h4 className="font-semibold text-purple-300 mb-2">Desenvolvedores</h4>
                              <p className="text-gray-300">{gameDetails.developers.join(', ')}</p>
                            </div>
                          )}
                          
                          {gameDetails.publishers && (
                            <div className="mt-4 mb-6"> {/* Adicionado mb-6 para espaço antes do GameSpecs */}
                              <h4 className="font-semibold text-purple-300 mb-2">Editoras</h4>
                              <p className="text-gray-300">{gameDetails.publishers.join(', ')}</p>
                            </div>
                          )}
                          
                          {/* GameSpecs com container próprio e bordas para destacar */}
                          <div className="mt-6 p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
                            <h4 className="font-semibold text-purple-300 mb-4">Requisitos do Sistema</h4>
                            <GameSpecs gameRequirements={gameDetails.pc_requirements} />
                          </div>

                        </div>
                        
                        <div>
                          <div className="space-y-4">
                            {gameDetails.release_date && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-5 w-5 text-purple-400" />
                                <div>
                                  <p className="text-sm text-gray-400">Data de Lançamento</p>
                                  <p className="text-white">{gameDetails.release_date.date}</p>
                                </div>
                              </div>
                            )}
                            
                            {gameDetails.metacritic && (
                              <div className="flex items-center space-x-2">
                                <Star className="h-5 w-5 text-yellow-400" />
                                <div>
                                  <p className="text-sm text-gray-400">Metacritic</p>
                                  <p className="text-white">{gameDetails.metacritic.score}/100</p>
                                </div>
                              </div>
                            )}
                            
                            {gameDetails.recommendations && (
                              <div className="flex items-center space-x-2">
                                <TrendingUp className="h-5 w-5 text-green-400" />
                                <div>
                                  <p className="text-sm text-gray-400">Recomendações</p>
                                  <p className="text-white">{gameDetails.recommendations.total.toLocaleString()}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-6">
                      {gameReviews && (
                        <div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="bg-green-500/10 border-green-500/20">
                              <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-green-400">
                                  {gameReviews.query_summary.total_positive?.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-400">Avaliações Positivas</div>
                              </CardContent>
                            </Card>
                            
                            <Card className="bg-red-500/10 border-red-500/20">
                              <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-red-400">
                                  {gameReviews.query_summary.total_negative?.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-400">Avaliações Negativas</div>
                              </CardContent>
                            </Card>
                            
                            <Card className="bg-blue-500/10 border-blue-500/20">
                              <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-blue-400">
                                  {gameReviews.query_summary.review_score_desc}
                                </div>
                                <div className="text-sm text-gray-400">Avaliação Geral</div>
                              </CardContent>
                            </Card>
                          </div>
                          
                          <h4 className="text-xl font-semibold mb-4">Comentários Recentes</h4>
                          <div className="space-y-4">
                            {gameReviews.reviews?.slice(0, 5).map((review, index) => (
                              <motion.div
                                key={review.recommendationid}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                <Card className="bg-white/5 border-white/10">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center space-x-2">
                                        <Badge 
                                          variant={review.voted_up ? "default" : "destructive"}
                                          className={review.voted_up ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}
                                        >
                                          {review.voted_up ? "👍 Recomendado" : "👎 Não Recomendado"}
                                        </Badge>
                                        <span className="text-sm text-gray-400">
                                          {formatPlaytime(review.author.playtime_forever)} jogadas
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1 text-sm text-gray-400">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{review.votes_up}</span>
                                      </div>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                                      {review.review}
                                    </p>
                                    <div className="mt-3 text-xs text-gray-500">
                                      Postado em {formatDate(review.timestamp_created)}
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="stats" className="mt-6">
                      <GameStatsChart appId={selectedGame?.appid} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <p className="mt-4 text-gray-400">Carregando...</p>
          </div>
        )}

        {/* Empty State */}
        {!selectedGame && searchResults.length === 0 && !loading && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Gamepad2 className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Comece sua jornada</h3>
            <p className="text-gray-400">
              Digite o nome de um jogo na barra de pesquisa para começar a explorar
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default App

