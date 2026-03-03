// src/components/MarketMap.tsx
import React, { useState } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer } from '@deck.gl/layers'; 
import { OrthographicView } from '@deck.gl/core';
import { HydratedNode, MarketFrame } from '../utils/processData';

/* --- THE THERMODYNAMIC COLOR PALETTE --- */
const PHASE_COLORS: Record<string, [number, number, number, number]> = {
  ELASTIC: [0, 150, 255, 200],         // Cool Blue (Stable Lattice)
  SUPERCRITICAL: [255, 140, 0, 240],   // Intense Orange (Viscous Relaxation)
  BALLISTIC: [200, 0, 255, 255],       // Purple/Hot-White (High-Energy)
};

interface MarketMapProps {
  data: MarketFrame;
  onNodeClick?: (node: HydratedNode) => void;
  onBackgroundClick?: () => void;
}

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  zoom: 0.5,
  minZoom: 0.1,
  maxZoom: 4
};

export default function MarketMap({ data, onNodeClick, onBackgroundClick }: MarketMapProps) {
  const [hoverInfo, setHoverInfo] = useState<any>(null);

  // Detect if we are transitioning into an "Inhale" (09:30) or "Exhale" (10:30) frame
  const isExhale = data.date.includes("10:30");

  // 1. Render the Ticker Nodes in the Phase Space
  const scatterLayer = new ScatterplotLayer({
    id: 'thermodynamic-nodes',
    data: data.nodes,
    getPosition: (d: HydratedNode) => [d.x, d.y],
    getFillColor: (d: HydratedNode) => PHASE_COLORS[d.phase] || [150, 150, 150, 150],
    getRadius: (d: HydratedNode) => d.phase === 'ELASTIC' ? 3 : 5, // Make critical nodes larger
    radiusUnits: 'pixels',
    lineWidthUnits: 'pixels',
    stroked: true,
    getLineColor: [255, 255, 255, 100],
    getLineWidth: 1,
    pickable: true,
    updateTriggers: {
      getPosition: [data.date], // Force re-render when time slider moves
      getFillColor: [data.date]
    },
    transitions: {
        getPosition: {
            type: 'spring',
            // THE PHYSICS ENGINE:
            // 10:30 Exhale: Stiff restorative force (snap/bounce)
            // 09:30 Inhale: Loose/viscous spread (float)
            stiffness: isExhale ? 400 : 120, 
            damping: isExhale ? 12 : 25      
        },
        getFillColor: {
            duration: 500, // Smooth color crossfade during phase transitions
            easing: (t: number) => t
        }
    }
  });

  // 2. Render the Topological Boundary Lines (Axes and Capacity)
  const boundaryLayer = new LineLayer({
    id: 'phase-boundaries',
    data: [
        // X-Axis Baseline (Log H_eff = 0)
        { sourcePosition: [-400, 0], targetPosition: [600, 0], color: [255, 255, 255, 50] },
        // Y-Axis Boundary (E.g., mapping Merton Distance = 2.0 as a critical threshold)
        { sourcePosition: [-100, -300], targetPosition: [-100, 500], color: [255, 255, 255, 50] }
    ],
    getSourcePosition: d => d.sourcePosition,
    getTargetPosition: d => d.targetPosition,
    getColor: d => d.color,
    getWidth: 2,
    widthUnits: 'pixels'
  });

  return (
    <>
        <DeckGL
            views={new OrthographicView({ id: 'ortho' })}
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={[boundaryLayer, scatterLayer]}
            onHover={(info: any) => setHoverInfo(info)}
            getTooltip={({object}) => object ? `${object.ticker}\nPhase: ${object.phase}\nXi: ${object.xi.toExponential(2)}\nMerton: ${object.merton.toFixed(2)}` : null}
            onClick={(info: any) => {
                if (info.object && onNodeClick) {
                     onNodeClick(info.object);
                } else if (onBackgroundClick) {
                    onBackgroundClick();
                }
            }}
        />
    </>
  );
}
