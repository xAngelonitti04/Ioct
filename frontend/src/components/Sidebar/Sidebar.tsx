import { AssetPanel } from './AssetPanel'
import { NodesPanel } from './NodesPanel'
import { AnalyticsPanel } from './AnalyticsPanel'
import { ProjectsPanel } from './ProjectsPanel'
import type { Project, SceneModel } from '../../App'

interface IoCtNode {
  ioct_node_id: string
  name: string
  sensor_type?: string
  status?: string
}

interface SidebarProps {
  activeTab: string
  selectedModelIndex: number | null
  selectedModelNode?: IoCtNode
  onAddNode: (modelIndex: number, node: IoCtNode) => void
  currentProject: Project | null
  models: SceneModel[]
  onSelectProject: (project: Project) => void
  onImportProject: (file: File) => void
}

export function Sidebar({ activeTab, selectedModelIndex, selectedModelNode, onAddNode, currentProject, models, onSelectProject, onImportProject }: SidebarProps) {
  return (
    <div style={{ height: '100%' }}>
      {activeTab === 'scene'     && <AssetPanel />}
      {activeTab === 'analytics' && <AnalyticsPanel />}
      {activeTab === 'nodes'     && (
        <NodesPanel
          selectedModelIndex={selectedModelIndex}
          selectedModelNode={selectedModelNode}
          onAddNode={onAddNode}
        />
      )}
      {activeTab === 'assets'    && <AssetPanel />}
      {activeTab === 'projects'  && (
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