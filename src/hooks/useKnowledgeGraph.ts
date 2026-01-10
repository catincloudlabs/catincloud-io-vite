import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface GraphConnection {
  target: string; 
  strength: number; 
  articles: string[]; 
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
      setLoading(true); // Start loading
      console.log(`🔍 [Graph] Fetching intel for ${ticker}...`);
      
      try {
        // 1. Get all News IDs mentioning this ticker
        const { data: newsEdges } = await supabase
          .from('knowledge_graph')
          .select('source_node') 
          .eq('target_node', ticker)
          .eq('edge_type', 'MENTIONS');

        if (!newsEdges || newsEdges.length === 0) {
          console.log(`⚠️ [Graph] No news edges found for ${ticker}`);
          setConnections([]);
          return;
        }

        const newsIds = newsEdges.map(e => e.source_node);

        // 2. Fetch Headlines
        const { data: newsArticles } = await supabase
          .from('news_vectors')
          .select('id, headline')
          .in('id', newsIds);

        const headlineMap = new Map<string, string>();
        if (newsArticles) {
          newsArticles.forEach(a => headlineMap.set(String(a.id), a.headline));
        }

        // 3. Find Correlations
        const { data: relatedEdges } = await supabase
          .from('knowledge_graph')
          .select('target_node, source_node')
          .in('source_node', newsIds) 
          .neq('target_node', ticker) 
          .eq('edge_type', 'MENTIONS');

        if (!relatedEdges || relatedEdges.length === 0) {
          setConnections([]);
          return;
        }

        // 4. Aggregate
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

        console.log(`✅ [Graph] Found ${sortedConnections.length} connections for ${ticker}`);
        setConnections(sortedConnections);

      } catch (e) {
        console.error("Graph Error:", e);
      } finally {
        setLoading(false); // Finished
      }
    };

    fetchGraph();
  }, [ticker]);

  return { connections, loading };
}
