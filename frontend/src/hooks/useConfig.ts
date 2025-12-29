import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';

interface PublicConfig {
  supportEmail: string;
}

const DEFAULT_CONFIG: PublicConfig = {
  supportEmail: 'noreply@example.com',
};

let cachedConfig: PublicConfig | null = null;

export function useConfig() {
  const [config, setConfig] = useState<PublicConfig>(cachedConfig || DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (cachedConfig) {
      return;
    }

    async function fetchConfig() {
      try {
        const response = await apiClient.get<PublicConfig>('/v1/config/public');
        cachedConfig = response.data;
        setConfig(response.data);
      } catch {
        // Use default config on error
        cachedConfig = DEFAULT_CONFIG;
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { config, isLoading };
}
