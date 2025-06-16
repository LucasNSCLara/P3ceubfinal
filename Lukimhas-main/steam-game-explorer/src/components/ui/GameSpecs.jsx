// src/components/ui/GameSpecs.jsx
import { useState } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Check, X, Cpu, CircuitBoard, Gpu, HardDrive, Monitor, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameSpecs({ gameRequirements }) {
  const [userSpecs, setUserSpecs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRequirement, setSelectedRequirement] = useState('minimum');

  // Função para limpar o HTML dos requisitos
  const cleanHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '')
              .replace(/\t/g, '')
              .replace(/\n\n+/g, '\n')
              .trim();
  };

  // Função para extrair os requisitos do texto
  const parseRequirements = (requirementsHtml) => {
    if (!requirementsHtml) return null;
    const clean = cleanHtml(requirementsHtml);
    return {
      os: clean.match(/OS:(.*?)(?:\n|$)/i)?.[1]?.trim(),
      processor: clean.match(/Processor:(.*?)(?:\n|$)/i)?.[1]?.trim(),
      memory: clean.match(/Memory:(.*?)(?:\n|$)/i)?.[1]?.trim(),
      graphics: clean.match(/Graphics:(.*?)(?:\n|$)/i)?.[1]?.trim(),
      storage: clean.match(/(?:Storage|Hard Drive):(.*?)(?:\n|$)/i)?.[1]?.trim(),
    };
  };

  // Se não houver requisitos, mostra mensagem
  if (!gameRequirements || (!gameRequirements.minimum && !gameRequirements.recommended)) {
    return (
      <div className="p-4 rounded-lg bg-purple-500/10 text-center">
        <p className="text-sm text-gray-300">
          Requisitos do sistema não disponíveis para este jogo.
        </p>
      </div>
    );
  }

  // Parse dos requisitos mínimos e recomendados
  const minReqs = parseRequirements(gameRequirements.minimum);
  const recReqs = parseRequirements(gameRequirements.recommended);

  const getSystemSpecs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Primeiro, obter as specs do sistema
      const specsResponse = await fetch('http://localhost:5001/api/system/specs');
      if (!specsResponse.ok) {
        throw new Error('Falha ao obter especificações do sistema');
      }
      const specsData = await specsResponse.json();
      setUserSpecs(specsData);

      // Depois, fazer a comparação
      const requirements = selectedRequirement === 'minimum' ? minReqs : recReqs;
      const comparisonResponse = await fetch('http://localhost:5001/api/system/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_requirements: {
            [selectedRequirement]: requirements
          },
          type: selectedRequirement
        })
      });

      if (!comparisonResponse.ok) {
        throw new Error('Falha ao comparar especificações');
      }

      const comparisonData = await comparisonResponse.json();
      setComparisonResult(comparisonData.comparison);
      setShowComparison(true);
    } catch (error) {
      console.error('Erro ao obter specs do sistema:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCompatibilityIcon = (compatible, confidence) => {
    if (compatible) {
      return confidence === 'high' ? 
        <CheckCircle className="w-5 h-5 text-green-400" /> : 
        <Check className="w-5 h-5 text-yellow-400" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getCompatibilityColor = (compatible, confidence) => {
    if (compatible) {
      return confidence === 'high' ? 'text-green-400' : 'text-yellow-400';
    }
    return 'text-red-400';
  };

  const renderRequirementCard = (title, requirements, type) => {
    if (!requirements) return null;

    return (
      <Card className="bg-gray-950/50 border-purple-500/20">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-purple-300">{title}</h4>
            {showComparison && (
              <Button
                variant={selectedRequirement === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRequirement(type)}
                className="text-xs"
              >
                Comparar
              </Button>
            )}
          </div>
          
          {requirements.os && (
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-purple-500/20">
              <Monitor className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm text-gray-400">Sistema Operacional</span>
                <p className="text-sm text-white">{requirements.os}</p>
              </div>
            </div>
          )}

          {requirements.processor && (
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-purple-500/20">
              <Cpu className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm text-gray-400">Processador</span>
                <p className="text-sm text-white">{requirements.processor}</p>
              </div>
            </div>
          )}

          {requirements.memory && (
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-purple-500/20">
              <CircuitBoard className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm text-gray-400">Memória RAM</span>
                <p className="text-sm text-white">{requirements.memory}</p>
              </div>
            </div>
          )}

          {requirements.graphics && (
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-purple-500/20">
              <Gpu className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm text-gray-400">Placa de Vídeo</span>
                <p className="text-sm text-white">{requirements.graphics}</p>
              </div>
            </div>
          )}

          {requirements.storage && (
            <div className="flex items-center gap-4">
              <HardDrive className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm text-gray-400">Armazenamento</span>
                <p className="text-sm text-white">{requirements.storage}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Requisitos Mínimos */}
      {renderRequirementCard("Requisitos Mínimos", minReqs, "minimum")}

      {/* Requisitos Recomendados */}
      {renderRequirementCard("Requisitos Recomendados", recReqs, "recommended")}

      {/* Botão de Comparação */}
      <Button
        onClick={getSystemSpecs}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
      >
        {loading ? "Analisando..." : `Comparar com meu PC (${selectedRequirement === 'minimum' ? 'Mínimos' : 'Recomendados'})`}
      </Button>

      {/* Erro */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Resultado da Comparação */}
      <AnimatePresence>
        {showComparison && userSpecs && comparisonResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Resultado Geral */}
            <Card className={`bg-gray-950/50 border-2 ${
              comparisonResult.overall_compatible 
                ? 'border-green-500/50' 
                : 'border-red-500/50'
            }`}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  {comparisonResult.overall_compatible ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-400" />
                  )}
                  <div>
                    <h4 className={`text-lg font-semibold ${
                      comparisonResult.overall_compatible ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {comparisonResult.overall_compatible ? 'Compatível!' : 'Incompatível'}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Compatibilidade: {comparisonResult.compatibility_percentage?.toFixed(0)}%
                    </p>
                  </div>
                </div>
                
                {/* Detalhes da Comparação */}
                <div className="space-y-3">
                  {comparisonResult.details.os && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Sistema Operacional</p>
                          <p className="text-xs text-gray-400">{comparisonResult.details.os.reason}</p>
                        </div>
                      </div>
                      {getCompatibilityIcon(comparisonResult.details.os.compatible, comparisonResult.details.os.confidence)}
                    </div>
                  )}

                  {comparisonResult.details.ram && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
                      <div className="flex items-center gap-3">
                        <CircuitBoard className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Memória RAM</p>
                          <p className="text-xs text-gray-400">{comparisonResult.details.ram.reason}</p>
                          {comparisonResult.details.ram.user_value && (
                            <p className="text-xs text-gray-500">
                              Seu PC: {comparisonResult.details.ram.user_value} | 
                              Necessário: {comparisonResult.details.ram.required_value}
                            </p>
                          )}
                        </div>
                      </div>
                      {getCompatibilityIcon(comparisonResult.details.ram.compatible, comparisonResult.details.ram.confidence)}
                    </div>
                  )}

                  {comparisonResult.details.cpu && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
                      <div className="flex items-center gap-3">
                        <Cpu className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Processador</p>
                          <p className="text-xs text-gray-400">{comparisonResult.details.cpu.reason}</p>
                        </div>
                      </div>
                      {getCompatibilityIcon(comparisonResult.details.cpu.compatible, comparisonResult.details.cpu.confidence)}
                    </div>
                  )}

                  {comparisonResult.details.gpu && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
                      <div className="flex items-center gap-3">
                        <Gpu className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Placa de Vídeo</p>
                          <p className="text-xs text-gray-400">{comparisonResult.details.gpu.reason}</p>
                        </div>
                      </div>
                      {getCompatibilityIcon(comparisonResult.details.gpu.compatible, comparisonResult.details.gpu.confidence)}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Especificações do Usuário */}
            <Card className="bg-gray-950/50 border-purple-500/20">
              <div className="p-4">
                <h4 className="text-lg font-semibold text-purple-300 mb-4">Especificações do Seu PC</h4>
                
                <div className="space-y-3">
                  {userSpecs.os && !userSpecs.os.error && (
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Sistema Operacional</p>
                        <p className="text-xs text-gray-400">{userSpecs.os.full_name}</p>
                      </div>
                    </div>
                  )}

                  {userSpecs.cpu && !userSpecs.cpu.error && (
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Processador</p>
                        <p className="text-xs text-gray-400">{userSpecs.cpu.brand}</p>
                        <p className="text-xs text-gray-500">
                          {userSpecs.cpu.cores_physical} núcleos físicos, {userSpecs.cpu.cores_logical} lógicos
                        </p>
                      </div>
                    </div>
                  )}

                  {userSpecs.ram && !userSpecs.ram.error && (
                    <div className="flex items-center gap-3">
                      <CircuitBoard className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Memória RAM</p>
                        <p className="text-xs text-gray-400">{userSpecs.ram.total} total</p>
                        <p className="text-xs text-gray-500">
                          {userSpecs.ram.available} disponível ({userSpecs.ram.percent_used} em uso)
                        </p>
                      </div>
                    </div>
                  )}

                  {userSpecs.gpu && !userSpecs.gpu.error && (
                    <div className="flex items-center gap-3">
                      <Gpu className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Placa de Vídeo</p>
                        <p className="text-xs text-gray-400">{userSpecs.gpu.name}</p>
                        {userSpecs.gpu.memory && (
                          <p className="text-xs text-gray-500">
                            Memória: {userSpecs.gpu.memory.total}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

