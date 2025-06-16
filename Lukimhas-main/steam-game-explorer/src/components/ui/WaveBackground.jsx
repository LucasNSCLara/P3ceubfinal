import { useEffect, useRef } from 'react';

const WaveBackground = ({ isDarkMode }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cores específicas para recriar o efeito de transição no modo escuro
      const gradientColors = isDarkMode 
        ? [
            'rgba(126, 34, 206, 0.3)',   // purple-600 com baixa opacidade
            'rgba(88, 28, 135, 0.4)',    // purple-800
            'rgba(46, 16, 101, 0.5)'     // purple-900 com maior opacidade
          ]
        : [
            'rgba(236, 25, 155, 0.92)',  // Rosa mais claro (#EEAECA)
            'rgba(151, 25, 219, 0.84)',  // Tom médio
            'rgba(47, 135, 236, 0.9)'   // Azul mais escuro (#94BBE9)
          ];

      // Desenhar camadas de ondas com diferentes características
      for (let layer = 0; layer < 3; layer++) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradientColors.forEach((color, index) => {
          gradient.addColorStop(index / (gradientColors.length - 1), color);
        });

        ctx.fillStyle = gradient;

        // Múltiplas ondas por camada para criar mais profundidade
        for (let wave = 0; wave < 2; wave++) {
          ctx.beginPath();
          ctx.moveTo(0, canvas.height);

          for (let x = 0; x <= canvas.width; x += 10) {
            const frequency = 0.0006 + (layer * 0.0003) + (wave * 0.0002);
            const amplitude = 30 + (layer * 15) + (wave * 10);
            const y = canvas.height - 
                     (Math.sin(x * frequency + time * (0.15 + layer * 0.05)) * amplitude) - 
                     (layer * 30);
            
            ctx.lineTo(x, y);
          }

          ctx.lineTo(canvas.width, canvas.height);
          ctx.closePath();

          // Ajusta a opacidade para criar profundidade
          const baseOpacity = isDarkMode ? 0.4 : 0.3;
          ctx.globalAlpha = baseOpacity + (layer * 0.1) + (wave * 0.05);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      time += 0.005; // Movimento mais lento para ondas mais suaves
      animationFrameId = requestAnimationFrame(drawWave);
    };

    window.addEventListener('resize', resize);
    resize();
    drawWave();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  return (
    <>
      {/* Camada de fundo base */}
      <div 
        className={`fixed inset-0 w-full h-full transition-colors duration-700 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-950 via-purple-950/30 to-gray-950' 
            : 'bg-gradient-to-br from-[#EEAECA] to-[#94BBE9]'
        }`}
        style={{ 
          opacity: 0.95,
          zIndex: 0 
        }}
      />
      
      {/* Canvas para as waves - agora com z-index maior */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full transition-opacity duration-700"
        style={{ 
          opacity: isDarkMode ? 0.85 : 0.8,
          mixBlendMode: isDarkMode ? 'lighten' : 'soft-light',
          zIndex: 1
        }}
      />
      
      {/* Camada de overlay opcional para ajustar contraste */}
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ 
          zIndex: 2,
          background: isDarkMode 
            ? 'linear-gradient(to bottom right, rgba(0,0,0,0.1), rgba(88, 28, 135, 0.1))'
            : 'linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(238, 174, 202, 0.1))'
        }}
      />
      
      {/* Conteúdo principal deve ter z-index maior que 2 */}
    </>
  );
};

export default WaveBackground;