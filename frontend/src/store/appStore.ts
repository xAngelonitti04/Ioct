import { create } from 'zustand'

export interface Asset {
  asset_id: string
  title: string
  artist_name?: string
  asset_type?: string
  conservation_state?: string
  location?: string
  description?: string
}

export interface IoCtNode {
  ioct_node_id: string
  name: string
  sensor_type?: string
  status?: string
  serial_number?: string
  manufacturer?: string
  model?: string
}

interface AppState {
  assets: Asset[]
  nodes: IoCtNode[]
  selectedAsset: Asset | null
  selectedNode: IoCtNode | null
  fetchAssets: () => Promise<void>
  fetchNodes: () => Promise<void>
  setSelectedAsset: (a: Asset | null) => void
  setSelectedNode: (n: IoCtNode | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  assets: [],
  nodes: [],
  selectedAsset: null,
  selectedNode: null,

  fetchAssets: async () => {
    const res = await fetch('/api/assets/')
    const data: Asset[] = await res.json()
    set({ assets: data })
  },

  fetchNodes: async () => {
    const res = await fetch('/api/ioct-nodes/')
    const data: IoCtNode[] = await res.json()
    set({ nodes: data })
  },

  setSelectedAsset: (a: Asset | null) => set({ selectedAsset: a }),
  setSelectedNode: (n: IoCtNode | null) => set({ selectedNode: n }),
}))
