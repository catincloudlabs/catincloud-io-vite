// src/lib/plotly-custom.js

// 1. Load the core engine (smallest possible base)
import Plotly from 'plotly.js/lib/core';

// 2. Import only the types of charts needed
import scatter from 'plotly.js/lib/scatter';
import bar from 'plotly.js/lib/bar';
import pie from 'plotly.js/lib/pie';
import heatmap from 'plotly.js/lib/heatmap';
import scatterpolar from 'plotly.js/lib/scatterpolar';

// 3. Register them
Plotly.register([
  scatter,
  bar,
  pie,
  heatmap,
  scatterpolar
]);

export default Plotly;
