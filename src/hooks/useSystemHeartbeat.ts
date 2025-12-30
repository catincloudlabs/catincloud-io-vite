import { useState, useEffect } from 'react';

// Define the shape of our metadata based on the Airflow DAG
export interface SystemMetadata {
  system_status: 'Healthy' | 'Degraded' | 'Maintenance' | 'Stale'; // Added 'Stale'
  last_updated_utc: string;
  pipeline_version: string;
  metrics: {
    total_rows_managed: number;
    modules_active: string[];
  };
  notices: string[];
}

export const useSystemHeartbeat = () => {
  const [data, setData] = useState<SystemMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeartbeat = async () => {
      try {
        // Cache Busting: ?t=timestamp forces a fresh fetch from CloudFront/S3
        const response = await fetch(`/data/metadata.json?t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`Status Code: ${response.status}`);
        }
        
        const result: SystemMetadata = await response.json();

        // --- CLIENT-SIDE FRESHNESS CHECK ---
        // If Airflow dies, the file won't update. We must catch this in the browser.
        const lastUpdate = new Date(result.last_updated_utc).getTime();
        const now = Date.now();
        const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);

        if (hoursDiff > 26) {
           console.warn(`System Heartbeat is stale by ${hoursDiff.toFixed(1)} hours.`);
           // Override status to warn the user
           result.system_status = 'Stale'; 
           result.notices.push("Data stream has stopped updating.");
        }
        // -----------------------------------

        setData(result);
      } catch (err) {
        console.error("Failed to fetch system heartbeat:", err);
        setError("System status unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchHeartbeat();
    
    // Poll every 5 minutes
    const interval = setInterval(fetchHeartbeat, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};
