import { useState, useEffect } from 'react';

// Define the shape of our metadata based on the Airflow DAG
interface SystemMetadata {
  system_status: 'Healthy' | 'Degraded' | 'Maintenance';
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
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch system heartbeat:", err);
        setError("System status unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchHeartbeat();
    
    // Optional: Poll every 5 minutes
    const interval = setInterval(fetchHeartbeat, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};
