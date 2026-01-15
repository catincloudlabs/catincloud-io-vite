import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

/* --- KNOWLEDGE GRAPH HOOK --- */
/* Fetches semantic correlations and news headlines for a specific ticker */

export interface GraphConnection {
  target: string; 
  strength: number; 
  articles: string[]; 
}

export function useKnowledgeGraph(ticker: string | null) {
  const [connections, setConnections] = useState<GraphConnection[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [lastFetchedTicker, setLastFetchedTicker] = useState<string | null>(null);

  // Derived state to prevent stale data rendering
  const loading = internalLoading || (ticker !== lastFetchedTicker);

  useEffect(() => {
    if (!ticker) {
      setConnections([]);
      setLastFetchedTicker(null);
      return;
    }

    const fetchGraph = async () => {
      setInternalLoading(true);
      
      try {
        // Step 1: Resolve News Edges
        const { data: newsEdges } = await supabase
          .from('knowledge_graph')
          .select('source_node') 
          .eq('target_node', ticker)
          .eq('edge_type', 'MENTIONS');

        if (!newsEdges || newsEdges.length === 0) {
          setConnections([]);
          setLastFetchedTicker(ticker); 
          return;
        }

        const newsIds = newsEdges.map(e => e.source_node);

        // Step 2: Hydrate Headlines
        const { data: newsArticles } = await supabase
          .from('news_vectors')
          .select('id, headline')
          .in('id', newsIds);

        const headlineMap = new Map<string, string>();
        if (newsArticles) {
          newsArticles.forEach(a => headlineMap.set(String(a.id), a.headline));
        }

        // Step 3: Identify Correlations
        const { data: relatedEdges } = await supabase
          .from('knowledge_graph')
          .select('target_node, source_node')
          .in('source_node', newsIds) 
          .neq('target_node', ticker) 
          .eq('edge_type', 'MENTIONS');

        if (!relatedEdges || relatedEdges.length === 0) {
          setConnections([]);
          setLastFetchedTicker(ticker);
          return;
        }

        // Step 4: Aggregate & Rank
        const tally: Record<string, { count: number, headlines: Set<string> }> = {};
        
        relatedEdges.forEach(edge => {
          if (!tally[edge.target_node]) {
            tally[edge.target_node] = { count: 0, headlines: new Set() };
          }
          tally[edge.target_node].count += 1;
          
          const hl = headlineMap.get(String(edge.source_node));
          if (hl) tally[edge.target_node].headlines.add(hl);
        });

        const sortedConnections = Object.entries(tally)
          .map(([target, data]) => ({
              target,
              strength: data.count,
              articles: Array.from(data.headlines).slice(0, 3) 
          }))
          .sort((a, b) => b.strength - a.strength)
          .slice(0, 6);

        setConnections(sortedConnections);
        setLastFetchedTicker(ticker); 

      } catch (e) {
        console.error("Graph Error:", e);
        setConnections([]); 
        setLastFetchedTicker(ticker);
      } finally {
        setInternalLoading(false);
      }
    };

    fetchGraph();
  }, [ticker]);

  return { connections, loading };
}
