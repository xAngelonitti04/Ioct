import { AssetPanel } from './AssetPanel'
import { NodesPanel } from './NodesPanel'
import { AnalyticsPanel } from './AnalyticsPanel'
import { ProjectsPanel } from './ProjectsPanel'
import type { Project, SceneModel, IoCtNode } from '../../App'

interface SidebarProps {
  activeTab: string
  selectedModelIndex: number | null
  selectedModelNode?: IoCtNode
  onAddNode: (modelIndex: number, node: IoCtNode) => void
  currentProject: Project | null
  models: SceneModel[]
  onSelectProject: (project: Project) => void
  onImportProject: (file: File) => void
  onSelectModel: (index: number) => void
  onLoadGlb: (file: File, assetId: number) => void
  onPlaceNode: (
    node: IoCtNode | null,
    artemisNodeId: string | null,
    position: [number, number, number]
  ) => void
  onActivatePlacement: (node: IoCtNode | null, artemisNodeId: string | null) => void
  onUpdatePreviewPosition: (position: [number, number, number]) => void
  previewPosition: [number, number, number] | null
  onDeleteNodeFromScene: (ioct_node_id: number) => void

  xrayMode: boolean
  xrayAssetIndex: number | null
  onToggleXray: (active: boolean) => void
  onStartSelectXrayAsset: () => void
  selectingXrayAsset: boolean
}

export function Sidebar({
  activeTab,
  selectedModelIndex,
  selectedModelNode,
  onAddNode,
  currentProject,
  models,
  onSelectProject,
  onImportProject,
  onSelectModel,
  onLoadGlb,
  onPlaceNode,
  onActivatePlacement,
  onUpdatePreviewPosition,
  previewPosition,
  onDeleteNodeFromScene,
  xrayMode,
  xrayAssetIndex,
  onToggleXray,
  onStartSelectXrayAsset,
  selectingXrayAsset,
}: SidebarProps) {
  return (
    <div style={{ height: '100%' }}>
      {activeTab === 'analytics' && (
        <AnalyticsPanel
          models={models}
          xrayMode={xrayMode}
          xrayAssetIndex={xrayAssetIndex}
          onToggleXray={onToggleXray}
          onStartSelectXrayAsset={onStartSelectXrayAsset}
          selectingXrayAsset={selectingXrayAsset}
        />
      )}

      {activeTab === 'nodes' && (
        <NodesPanel
          selectedModelIndex={selectedModelIndex}
          selectedModelNode={selectedModelNode}
          onAddNode={onAddNode}
          onPlaceNode={onPlaceNode}
          onActivatePlacement={onActivatePlacement}
          onUpdatePreviewPosition={onUpdatePreviewPosition}
          previewPosition={previewPosition}
          onDeleteNodeFromScene={onDeleteNodeFromScene}
        />
      )}

      {(activeTab === 'assets' || activeTab === 'scene') && (
        <AssetPanel
          currentProject={currentProject}
          models={models}
          selectedModelIndex={selectedModelIndex}
          onSelectModel={onSelectModel}
          onLoadGlb={onLoadGlb}
        />
      )}

      {activeTab === 'projects' && (
        <ProjectsPanel
          currentProject={currentProject}
          models={models}
          onSelectProject={onSelectProject}
          onImportProject={onImportProject}
        />
      )}
    </div>
  )
}