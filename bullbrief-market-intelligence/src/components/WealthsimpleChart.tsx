import React, { useRef, useState, useEffect } from 'react';

interface WealthsimpleChartProps {
  selectedInterval: '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL';
  selectedMetric: 'value' | 'returns';
  showBalances: boolean;
  onHoverPoint: (val: number | null, percentChange: number | null) => void;
  market?: 'USA' | 'Canada';
}

const USA_INDEX_DATASETS: Record<string, number[]> = {
  '1M': [5280, 5305, 5290, 5315, 5330, 5310, 5345, 5360, 5350, 5385, 5370, 5402, 5390, 5415, 5428, 5410, 5425, 5430.50],
  '3M': [5120, 5140, 5115, 5165, 5180, 5160, 5210, 5240, 5225, 5280, 5265, 5320, 5340, 5380, 5410, 5400, 5420, 5430.50],
  '6M': [4850, 4920, 4890, 4980, 5020, 4990, 5080, 5120, 5100, 5190, 5160, 5250, 5290, 5340, 5400, 5380, 5415, 5430.50],
  'YTD': [4770, 4820, 4850, 4810, 4920, 4980, 4950, 5040, 5100, 5070, 5180, 5240, 5280, 5320, 5360, 5380, 5410, 5430.50],
  '1Y': [4450, 4520, 4480, 4610, 4680, 4590, 4750, 4820, 4780, 4950, 5040, 4980, 5150, 5240, 5180, 5320, 5390, 5430.50],
  'ALL': [3200, 3420, 3280, 3650, 3810, 3690, 4120, 4280, 4150, 4480, 4650, 4520, 4850, 5020, 4880, 5210, 5340, 5430.50]
};

const CANADA_INDEX_DATASETS: Record<string, number[]> = {
  '1M': [21850, 21920, 21890, 21990, 22050, 21980, 22080, 22140, 22110, 22190, 22150, 22240, 22200, 22260, 22310, 22280, 22320, 22340.50],
  '3M': [21450, 21520, 21480, 21620, 21710, 21650, 21820, 21910, 21850, 21990, 21940, 22080, 22140, 22220, 22280, 22230, 22310, 22340.50],
  '6M': [20850, 20980, 20910, 21120, 21250, 21180, 21390, 21480, 21410, 21620, 21540, 21780, 21890, 22020, 22140, 22080, 22240, 22340.50],
  'YTD': [20580, 20720, 20810, 20750, 20950, 21120, 21040, 21280, 21420, 21350, 21590, 21740, 21880, 21980, 22110, 22160, 22280, 22340.50],
  '1Y': [19850, 20120, 19950, 20340, 20520, 20380, 20680, 20850, 20740, 21120, 21340, 21180, 21590, 21820, 21650, 22050, 22210, 22340.50],
  'ALL': [16200, 16980, 16420, 17580, 17920, 17550, 18650, 19120, 18820, 19950, 20450, 20120, 20950, 21420, 21080, 21920, 22180, 22340.50]
};

export default function WealthsimpleChart({
  selectedInterval,
  selectedMetric,
  showBalances,
  onHoverPoint,
  market = 'USA'
}: WealthsimpleChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);

  const datasetSource = market === 'Canada' ? CANADA_INDEX_DATASETS : USA_INDEX_DATASETS;
  const data = datasetSource[selectedInterval] || datasetSource['1M'];
  const baseValue = data[0];
  const finalValue = data[data.length - 1];

  const minVal = Math.min(...data) * 0.995;
  const maxVal = Math.max(...data) * 1.005;
  const range = maxVal - minVal;

  const width = 600;
  const height = 220;
  const paddingX = 0;
  const paddingY = 15;

  // Convert data values to SVG points
  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((val - minVal) / range) * (height - 2 * paddingY);
    return { x, y, value: val };
  });

  // Build curved path using Bezier curves
  const getCurvedPath = () => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  // Build closed area path for the gradient fill
  const getAreaPath = () => {
    const linePath = getCurvedPath();
    if (!linePath) return '';
    return `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xCoord = ((e.clientX - rect.left) / rect.width) * width;
    setMouseX(xCoord);

    // Find the closest point index
    let closestIdx = 0;
    let minDist = Infinity;
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - xCoord);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    setHoverIdx(closestIdx);

    const hoveredVal = points[closestIdx].value;
    const changeFromBase = hoveredVal - baseValue;
    const percentChange = (changeFromBase / baseValue) * 100;
    onHoverPoint(hoveredVal, percentChange);
  };

  const handleMouseLeave = () => {
    setHoverIdx(null);
    setMouseX(null);
    onHoverPoint(null, null);
  };

  const isPositive = finalValue >= baseValue;
  const strokeColor = isPositive ? '#12D162' : '#FF5C5C';
  const gradientId = `chart-gradient-${selectedInterval}`;

  return (
    <div className="w-full relative select-none" id="wealthsimple-interactive-stage">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle Horizontal Zero Reference line if hovered */}
        {hoverIdx !== null && (
          <line
            x1="0"
            y1={points[hoverIdx].y}
            x2={width}
            y2={points[hoverIdx].y}
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}

        {/* Filled Gradient Area */}
        <path d={getAreaPath()} fill={`url(#${gradientId})`} />

        {/* Continuous Curved Line */}
        <path
          d={getCurvedPath()}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertical tracking line */}
        {hoverIdx !== null && mouseX !== null && (
          <line
            x1={points[hoverIdx].x}
            y1="0"
            x2={points[hoverIdx].x}
            y2={height}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}

        {/* Tracking pointer circle */}
        {hoverIdx !== null && (
          <circle
            cx={points[hoverIdx].x}
            cy={points[hoverIdx].y}
            r="4.5"
            fill={strokeColor}
            stroke="#090909"
            strokeWidth="1.5"
            className="transition-all duration-75"
          />
        )}
      </svg>
    </div>
  );
}
