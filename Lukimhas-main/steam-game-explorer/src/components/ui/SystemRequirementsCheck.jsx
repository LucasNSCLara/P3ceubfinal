import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export default function SystemRequirementsCheck({ gameId }) {
  const [userSpecs, setUserSpecs] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameReqs, setGameReqs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset states when game changes
    setComparison(null);
    setGameReqs(null);
    setError(null);
  }, [gameId]);

  const checkSystemRequirements = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user specs
      const specsResponse = await fetch(`${API_URL}/system/specs`);
      const specs = await specsResponse.json();
      setUserSpecs(specs);

      // Get game requirements
      const reqsResponse = await fetch(`${API_URL}/steam/game/${gameId}/requirements`);
      const reqsData = await reqsResponse.json();
      
      if (!reqsData.requirements?.minimum) {
        throw new Error('Requisitos mínimos não encontrados');
      }

      setGameReqs(reqsData.requirements);
      compareSpecs(specs, reqsData.requirements.minimum);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const compareSpecs = (userSpecs, requirements) => {
    let score = 0;
    const results = {
      cpu: { matches: false, details: '', required: requirements.cpu },
      ram: { matches: false, details: '', required: requirements.ram },
      gpu: { matches: false, details: '', required: requirements.gpu }
    };

    // CPU Comparison
    if (userSpecs.cpu && requirements.cpu) {
      results.cpu.details = `Seu CPU: ${userSpecs.cpu.brand}`;
      results.cpu.matches = true; // Simplified comparison
      score += 1;
    }

    // RAM Comparison
    if (userSpecs.ram && requirements.ram) {
      const userRamGB = parseFloat(userSpecs.ram.total);
      const reqRamGB = parseFloat(requirements.ram);
      results.ram.details = `Sua RAM: ${userSpecs.ram.total}`;
      results.ram.matches = !isNaN(userRamGB) && !isNaN(reqRamGB) && userRamGB >= reqRamGB;
      score += results.ram.matches ? 1 : 0;
    }

    // GPU Comparison
    if (userSpecs.gpu && requirements.gpu) {
      results.gpu.details = `Sua GPU: ${userSpecs.gpu.name || 'Não detectada'}`;
      results.gpu.matches = userSpecs.gpu.name && !userSpecs.gpu.error;
      score += results.gpu.matches ? 1 : 0;
    }

    const level = score >= 3 ? 'excellent' : score >= 2 ? 'good' : score >= 1 ? 'minimum' : 'insufficient';
    setComparison({ level, results });
  };

  return (
    <div className="space-y-4">
      {/* Add gameId debug info */}
      <div className="text-xs text-gray-500 mb-2">
        Game ID: {gameId} (type: {typeof gameId})
      </div>
      
      <Button 
        onClick={checkSystemRequirements}
        disabled={loading}
        className="bg-purple-500 hover:bg-purple-600"
      >
        {loading ? 'Verificando...' : 'Roda?'}
      </Button>

      {error && (
        <Card className="bg-red-500/20 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-400">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {comparison && gameReqs && (
        <Card className={`${getResultMessage(comparison.level).color}`}>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center space-x-2">
              {getResultMessage(comparison.level).icon}
              <h3 className="text-lg font-semibold">
                {getResultMessage(comparison.level).message}
              </h3>
            </div>

            <div className="space-y-3">
              {Object.entries(comparison.results).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {value.matches ? 
                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                      <XCircle className="h-4 w-4 text-red-500" />
                    }
                    <span>{value.details}</span>
                  </div>
                  <div className="text-sm text-gray-500 ml-6">
                    Requerido: {value.required || 'Não especificado'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const getResultMessage = (level) => {
  switch (level) {
    case 'excellent':
      return { 
        message: 'Roda tranquilamente!', 
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        color: 'bg-green-500/20 border-green-500/30'
      };
    case 'good':
      return { 
        message: 'Roda normal', 
        icon: <CheckCircle className="h-6 w-6 text-blue-500" />,
        color: 'bg-blue-500/20 border-blue-500/30'
      };
    case 'minimum':
      return { 
        message: 'Roda, mas meio ruim', 
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
        color: 'bg-yellow-500/20 border-yellow-500/30'
      };
    default:
      return { 
        message: 'Não foi possível determinar', 
        icon: <AlertTriangle className="h-6 w-6 text-gray-500" />,
        color: 'bg-gray-500/20 border-gray-500/30'
      };
  }
};

