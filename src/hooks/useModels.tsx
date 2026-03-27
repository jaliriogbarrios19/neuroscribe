'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { listen } from '@tauri-apps/api/event';
import {
  checkModelStatus,
  downloadModel,
  getHardwareInfo,
  type HardwareInfo,
  type ModelStatus,
} from '@/app/actions/ia';

interface ModelContextValue {
  hwInfo: HardwareInfo | null;
  modelStatus: ModelStatus | null;
  loading: boolean;
  downloading: string | null;
  progress: number;
  refreshStatus: () => Promise<void>;
  startDownload: (modelName: string) => Promise<void>;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [hwInfo, setHwInfo] = useState<HardwareInfo | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [hw, status] = await Promise.all([
        getHardwareInfo(),
        checkModelStatus(),
      ]);
      setHwInfo(hw);
      setModelStatus(status);
    } finally {
      setLoading(false);
    }
  }, []);

  const startDownload = useCallback(
    async (modelName: string) => {
      if (downloading) return;
      setDownloading(modelName);
      setProgress(0);
      try {
        await downloadModel(modelName);
        await refreshStatus();
      } finally {
        setDownloading(null);
        setProgress(0);
      }
    },
    [downloading, refreshStatus]
  );

  useEffect(() => {
    refreshStatus();

    let unlistenFn: (() => void) | null = null;

    const setupListener = async () => {
      unlistenFn = await listen<number>('download-progress', event => {
        setProgress(event.payload);
      });
    };

    setupListener();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [refreshStatus]);

  return (
    <ModelContext.Provider
      value={{
        hwInfo,
        modelStatus,
        loading,
        downloading,
        progress,
        refreshStatus,
        startDownload,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModels() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModels must be used within a ModelProvider');
  return ctx;
}
