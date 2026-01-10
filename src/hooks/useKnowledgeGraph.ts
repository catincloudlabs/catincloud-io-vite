import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface GraphConnection {
  target: string; 
  strength: number; 
  articles: string[]; // Now populated with real headlines
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
      
      try {
        // 1. Get all News IDs mentioning this ticker
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

        // 2. Fetch the Headlines for these News IDs (The "Why")
        const { data: newsArticles } = await supabase
          .from('news_vectors')
          .select('id, headline')
          .in('id', newsIds);

        const headlineMap = new Map<string, string>();
        if (newsArticles) {
          newsArticles.forEach(a => headlineMap.set(str(a.id), a.headline));
        }

        // 3. Find OTHER tickers linked by these same News IDs
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

        // 4. Aggregate: Count strength AND collect headlines
        const tally: Record<string, { count: number, headlines: Set<string> }> = {};
        
        relatedEdges.forEach(edge => {
          if (!tally[edge.target_node]) {
            tally[edge.target_node] = { count: 0, headlines: new Set() };
          }
          tally[edge.target_node].count += 1;
          
          const hl = headlineMap.get(str(edge.source_node));
          if (hl) tally[edge.target_node].headlines.add(hl);
        });

        // 5. Format for UI
        const sortedConnections = Object.entries(tally)
          .map(([target, data]) => ({
              target,
              strength: data.count,
              articles: Array.from(data.headlines).slice(0, 3) // Top 3 headlines per link
          }))
          .sort((a, b) => b.strength - a.strength)
          .slice(0, 6); // Top 6 strong connections

        setConnections(sortedConnections);

      } catch (e) {
        console.error("Graph Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [ticker]);

  return { connections, loading };
}

// Helper to handle potentially numeric IDs safely
function str(val: any): string {
  return String(val);
}
