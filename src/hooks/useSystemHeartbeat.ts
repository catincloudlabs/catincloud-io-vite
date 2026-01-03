import { useState, useEffect } from 'react';

// Matches the JSON payload from the Airflow DAG
export interface SystemMetadata {
  system_status: 'Healthy' | 'Degraded' | 'Maintenance' | 'Stale';
  last_updated_utc: string;
  pipeline_version: string;
  metrics: {
    total_rows_managed: number;
    modules_active: string[];
  };
  // NEW: Matches the S3 'tests' object
  tests?: {
    passed: number;
    failed: number;
    total: number;
    error?: string; // Handle edge case where S3 fetch fails in DAG
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
        // Cache Busting: Forces fresh fetch from CloudFront/S3
        const response = await fetch(`/data/metadata.json?t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`Status Code: ${response.status}`);
        }
        
        const result: SystemMetadata = await response.json();

        // --- CLIENT-SIDE CHECKS ---
        
        // 1. Freshness Check
        const lastUpdate = new Date(result.last_updated_utc).getTime();
        const now = Date.now();
        const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);

        // Weekend Window: Friday PM to Tuesday AM allow for 72h gap
        const currentDay = new Date().getUTCDay(); // 0=Sun, 6=Sat
        const isWeekendWindow = [0, 1, 6].includes(currentDay);
        const stalenessThreshold = isWeekendWindow ? 72 : 26;

        if (hoursDiff > stalenessThreshold) {
           console.warn(`Heartbeat stale: ${hoursDiff.toFixed(1)}h (Limit: ${stalenessThreshold}h)`);
           result.system_status = 'Stale';
           const reason = isWeekendWindow ? "Market Closed" : "Pipeline Latency";
           result.notices.push(`Data Stream Paused (${reason}).`);
        }

        // 2. Test Integrity Check (Client-side Backup)
        if (result.tests && result.tests.failed > 0) {
            console.error(`Data Quality Alert: ${result.tests.failed} tests failed.`);
            // Optional: Force degraded state if not already set by DAG
            if (result.system_status === 'Healthy') {
                result.system_status = 'Degraded';
                result.notices.push(`Data Integrity Warning: ${result.tests.failed} validation tests failed.`);
            }
        }

        setData(result);
      } catch (err) {
        console.error("Failed to fetch system heartbeat:", err);
        setError("System status unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchHeartbeat();
    
    // Poll every 2 minutes
    const interval = setInterval(fetchHeartbeat, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};
