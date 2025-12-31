import { useState, useEffect } from 'react';

// Define the shape of our metadata based on the Airflow DAG
export interface SystemMetadata {
  system_status: 'Healthy' | 'Degraded' | 'Maintenance' | 'Stale';
  last_updated_utc: string;
  pipeline_version: string;
  metrics: {
    total_rows_managed: number;
    modules_active: string[];
  };
  // NEW: Added support for dbt test results
  tests?: {
    passed: number;
    failed: number;
    total: number;
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
        // Verify if data is stale based on the last update time
        const lastUpdate = new Date(result.last_updated_utc).getTime();
        const now = Date.now();
        const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);

        // 1. Detect Weekend Window (UTC)
        // 0=Sun, 1=Mon, ..., 6=Sat
        // We include Monday (1) because new data usually arrives Tuesday morning.
        const currentDay = new Date().getUTCDay();
        const isWeekendWindow = [0, 1, 6].includes(currentDay);

        // 2. Set Dynamic Threshold
        // Weekends: 72h (Friday Data -> Tuesday Run)
        // Weekdays: 26h (Daily Run + Buffer)
        const stalenessThreshold = isWeekendWindow ? 72 : 26;

        if (hoursDiff > stalenessThreshold) {
           console.warn(`System Heartbeat is stale by ${hoursDiff.toFixed(1)} hours (Threshold: ${stalenessThreshold}h).`);
           
           // Override status to warn the user
           result.system_status = 'Stale'; 
           
           // Add a helpful notice explaining why
           const reason = isWeekendWindow ? "Market Closed" : "Pipeline Delay";
           result.notices.push(`Data stream paused (${reason}). Last update: ${hoursDiff.toFixed(0)}h ago.`);
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
    
    // Poll every 5 minutes to keep the UI fresh without refreshing page
    const interval = setInterval(fetchHeartbeat, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};
