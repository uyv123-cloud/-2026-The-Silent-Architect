import React, { useMemo } from 'react';

interface Props {
  seed: string;
}

/**
 * A generative architectural blueprint.
 * V2.1: Removed filled elements to ensure text legibility. Pure wireframe aesthetic.
 */
const GenerativeCover: React.FC<Props> = ({ seed }) => {
  
  const hash = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return h;
  }, [seed]);

  const rand = (min: number, max: number, salt: number) => {
    const t = Math.abs(Math.sin(hash + salt) * 10000);
    return min + (t - Math.floor(t)) * (max - min);
  };

  const elements = useMemo(() => {
    const count = Math.floor(rand(5, 12, 0));
    const items = [];
    
    // 1. Grid Lines (The Base)
    const gridSpacing = rand(5, 15, 99);
    for(let i=0; i<100; i+=gridSpacing) {
         items.push(
            <line key={`grid-v-${i}`} x1={`${i}%`} y1="0" x2={`${i}%`} y2="100%" stroke="currentColor" strokeWidth="0.2" opacity="0.1" />
         );
    }

    // 2. Structural Elements
    for (let i = 0; i < count; i++) {
      // Prefer lines and circles for a cleaner look
      const type = rand(0, 1, i) > 0.6 ? 'rect' : (rand(0,1,i) > 0.4 ? 'circle' : 'line');
      const x = rand(10, 90, i * 2);
      const y = rand(10, 90, i * 3);
      const size = rand(5, 40, i * 4);
      const opacity = rand(0.1, 0.3, i * 6); // Slightly reduced max opacity
      
      if (type === 'rect') {
        const h = rand(5, 40, i * 5);
        items.push(
          <rect 
            key={i} 
            x={`${x}%`} 
            y={`${y}%`} 
            width={`${size}%`} 
            height={`${h}%`} 
            fill="none" 
            stroke="currentColor"
            strokeWidth="0.5"
            opacity={opacity}
          />
        );
      } else if (type === 'circle') {
         items.push(
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r={`${size / 2}%`}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray={i % 2 === 0 ? "4 4" : "none"}
              opacity={opacity}
            />
         );
      } else {
        // Structural Line / Axis
        const isVertical = rand(0,1,i*7) > 0.5;
        items.push(
          <line
            key={i}
            x1={`${x}%`}
            y1={`${y}%`}
            x2={isVertical ? `${x}%` : `${x + size}%`}
            y2={isVertical ? `${y + size}%` : `${y}%`}
            stroke="currentColor"
            strokeWidth={rand(0.5, 1.5, i)}
            opacity={opacity + 0.1}
          />
        );
      }
    }
    return items;
  }, [hash]); 

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-10 text-stone-800 mix-blend-multiply overflow-hidden">
      <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {elements}
      </svg>
      {/* Subtle Gradient to fade out the background at the bottom, improving footer readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-100/50 via-transparent to-transparent"></div>
    </div>
  );
};

export default GenerativeCover;