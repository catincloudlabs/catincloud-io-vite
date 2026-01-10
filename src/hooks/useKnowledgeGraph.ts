import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface GraphConnection {
  target: string; // The related ticker (e.g. "AMD")
  strength: number; // How strongly related?
  articles: string[]; // Headlines linking them
}

export function useKnowledgeGraph(ticker: string | null) {
  const [connections, setConnections] = useState<GraphConnection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) {
      setConnections([]);
      return;
    }

    const fetchGraph = async () => {
      setLoading(true);
      
      // 1. Find news IDs related to this ticker
      // We look for edges where this ticker is the target
      // (Assuming your ingest.py creates Ticker -> News edges or News -> Ticker)
      // Based on your ingest.py, it links News ID -> Ticker.
      // So we find all News IDs that point to THIS ticker.
      
      // Step A: Get Articles for Ticker
      const { data: newsEdges } = await supabase
        .from('knowledge_graph')
        .select('source_node') // This is the News ID
        .eq('target_node', ticker)
        .eq('edge_type', 'MENTIONS');

      if (!newsEdges || newsEdges.length === 0) {
        setConnections([]);
        setLoading(false);
        return;
      }

      const newsIds = newsEdges.map(e => e.source_node);

      // Step B: Find OTHER tickers mentioned in those SAME articles
      const { data: relatedEdges } = await supabase
        .from('knowledge_graph')
        .select('target_node, source_node')
        .in('source_node', newsIds) 
        .neq('target_node', ticker) // Exclude self
        .eq('edge_type', 'MENTIONS');

      if (!relatedEdges) {
        setConnections([]);
        setLoading(false);
        return;
      }

      // Step C: Aggregate counts (Strength)
      const tally: Record<string, number> = {};
      relatedEdges.forEach(edge => {
        tally[edge.target_node] = (tally[edge.target_node] || 0) + 1;
      });

      // Format for UI
      const sortedConnections = Object.entries(tally)
        .map(([target, strength]) => ({
            target,
            strength,
            articles: [] // We can fetch specific headlines in a v2 optimization
        }))
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 5); // Top 5 connections only

      setConnections(sortedConnections);
      setLoading(false);
    };

    fetchGraph();
  }, [ticker]);

  return { connections, loading };
}
