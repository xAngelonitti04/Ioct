import { useEffect, useState, useRef, useCallback } from 'react'
import { useAppStore } from './store/appStore'
import { Scene3D } from './components/Scene3D/Scene3D'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Navbar } from './components/Navbar/Navbar'
import { ModelUploadModal } from './components/ModelUploadModal'
import { ProjectStartModal } from './components/ProjectStartModal'

type Tab = 'scene' | 'analytics' | 'nodes' | 'assets' | 'projects'

interface ModelConfig {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

interface IoCtNode {
  ioct_node_id: string
  name: string
  sensor_type?: string
  status?: string
}

export interface Project {
  project_id: number
  name: string
  description?: string
  start_date?: string
  end_date?: string
  status?: string
}

export interface SceneModel {
  url: string
  glb_filename?: string
  scene_object_id?: number
  config: ModelConfig
  node?: IoCtNode
}

export async function loadProjectModels(project: Project): Promise<SceneModel[]> {
  try {
    const res = await fetch(`/api/scene-objects/project/${project.project_id}`)
    const objects = await res.json()
    if (!Array.isArray(objects) || objects.length === 0) return []
    return objects.map((obj: any) => ({
      url: `/models/${project.project_id}/${obj.glb_filename}`,
      glb_filename: obj.glb_filename,
      scene_object_id: obj.scene_object_id,
      config: {
        position: [obj.pos_x ?? 0, obj.pos_y ?? 0, obj.pos_z ?? 0] as [number, number, number],
        rotation: [obj.rot_x ?? 0, obj.rot_y ?? 0, obj.rot_z ?? 0] as [number, number, number],
        scale: [obj.scale_x ?? 1, obj.scale_y ?? 1, obj.scale_z ?? 1] as [number, number, number],
      },
      node: obj.ioct_node ?? undefined,
    }))
  } catch (e) {
    console.error('Errore caricamento modelli', e)
    return []
  }
}

function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('scene')
  const [lastTab, setLastTab] = useState<Tab>('assets')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [models, setModels] = useState<SceneModel[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedModelIndex, setSelectedModelIndex] = useState<number | null>(null)
  const isDragging = useRef(false)

  const fetchAssets = useAppStore((s: any) => s.fetchAssets)
  const fetchNodes  = useAppStore((s: any) => s.fetchNodes)

  useEffect(() => {
    fetchAssets()
    fetchNodes()
  }, [])

  useEffect(() => {
    if (activeTab === 'scene') {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [activeTab])

  const handleTabChange = (tab: Tab) => {
    if (tab !== 'scene') setLastTab(tab)
    setActiveTab(tab)
  }

  const handleSelectProject = async (project: Project) => {
    setCurrentProject(project)
    setModels([])
    setSelectedModelIndex(null)
    const loaded = await loadProjectModels(project)
    setModels(loaded)
  }

  const handleChangeProject = () => {
    setCurrentProject(null)
    setModels([])
    setSelectedModelIndex(null)
  }

  const handleModelUpload = (file: File) => {
    setPendingFile(file)
  }

  const handleDeleteModel = async (index: number) => {
    const model = models[index]
    if (model.scene_object_id) {
      await fetch(`/api/scene-objects/${model.scene_object_id}`, { method: 'DELETE' })
    }
    setModels(prev => prev.filter((_, i) => i !== index))
    setSelectedModelIndex(null)
  }

  const handleAddNode = (modelIndex: number, node: IoCtNode) => {
    setModels(prev => prev.map((m, i) =>
      i === modelIndex ? { ...m, node } : m
    ))
  }

  const handleImportProject = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        const project = data.project

        const res = await fetch('/api/projects/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: project.name,
            description: project.description || null,
            start_date: project.start_date || null,
            end_date: project.end_date || null,
            status: project.status || null,
          }),
        })
        const newProject = await res.json()
        setCurrentProject(newProject)
        const loaded = await loadProjectModels(newProject)
        setModels(loaded)
      } catch (err) {
        console.error('Errore importazione:', err)
      }
    }
    reader.readAsText(file)
  }

  const selectedModelNode = selectedModelIndex !== null
    ? models[selectedModelIndex]?.node
    : undefined

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) return
    setPendingFile(file)
  }

  const onMouseDown = useCallback(() => {
    isDragging.current = true
  }, [])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const newWidth = window.innerWidth - e.clientX
    if (newWidth > 150 && newWidth < 900) {
      setSidebarWidth(newWidth)
    }
  }, [])

  const onMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  return (
    <>
      {!currentProject && (
        <ProjectStartModal
          onSelect={handleSelectProject}
          onImport={handleImportProject}
        />
      )}

      <div
        style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1a2e' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onModelUpload={handleModelUpload}
          currentProject={currentProject}
          onChangeProject={handleChangeProject}
          models={models}
        />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          <div style={{ position: 'absolute', inset: 0 }}>
            <Scene3D
              models={models}
              onDelete={handleDeleteModel}
              activeTab={activeTab}
              onSelectModel={setSelectedModelIndex}
            />
          </div>

          <div style={{
            position: 'absolute',
            top: 0,
            right: sidebarOpen ? 0 : -sidebarWidth,
            width: sidebarWidth,
            height: '100%',
            background: '#16213e',
            overflowY: 'auto',
            transition: isDragging.current ? 'none' : 'right 0.3s ease',
            zIndex: 10,
          }}>
            <div
              onMouseDown={onMouseDown}
              style={{
                position: 'absolute',
                left: 0, top: 0,
                width: 4, height: '100%',
                cursor: 'ew-resize',
                background: 'rgba(255,255,255,0.05)',
                zIndex: 20,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            />
            <Sidebar
              activeTab={activeTab}
              selectedModelIndex={selectedModelIndex}
              selectedModelNode={selectedModelNode}
              onAddNode={handleAddNode}
              currentProject={currentProject}
              models={models}
              onSelectProject={handleSelectProject}
              onImportProject={handleImportProject}
            />
          </div>

          <button
            onClick={() => {
              const opening = !sidebarOpen
              setSidebarOpen(opening)
              if (opening) setActiveTab(lastTab)
            }}
            style={{
              position: 'absolute',
              right: sidebarOpen ? sidebarWidth : 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: 20, height: 48,
              background: '#0f172a',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: '6px 0 0 6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
              transition: 'right 0.3s ease',
            }}
          >
            <i className={sidebarOpen ? 'ti ti-chevron-right' : 'ti ti-chevron-left'} style={{ fontSize: 14 }} />
          </button>

        </div>

        {isDragOver && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(59,130,246,0.15)',
            border: '2px dashed rgba(59,130,246,0.6)',
            zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#60a5fa' }}>
              <i className="ti ti-upload" style={{ fontSize: 48 }} />
              <p style={{ fontSize: 18, fontWeight: 500 }}>Rilascia il file GLB</p>
            </div>
          </div>
        )}

        {pendingFile && (
          <ModelUploadModal
            file={pendingFile}
            onConfirm={async (url, config) => {
              try {
                const formData = new FormData()
                formData.append('file', pendingFile!)

                const uploadRes = await fetch(`/api/scene-objects/upload/${currentProject?.project_id}`, {
                  method: 'POST',
                  body: formData,
                })
                const { filename } = await uploadRes.json()

                const res = await fetch('/api/scene-objects/', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    glb_filename: filename,
                    project_id: currentProject?.project_id,
                    pos_x: config.position[0],
                    pos_y: config.position[1],
                    pos_z: config.position[2],
                    rot_x: config.rotation[0],
                    rot_y: config.rotation[1],
                    rot_z: config.rotation[2],
                    scale_x: config.scale[0],
                    scale_y: config.scale[1],
                    scale_z: config.scale[2],
                  }),
                })
                const saved = await res.json()

                setModels(prev => [...prev, {
                  url: `/models/${currentProject?.project_id}/${filename}`,
                  glb_filename: filename,
                  scene_object_id: saved.scene_object_id,
                  config,
                }])
              } catch (err) {
                console.error('Errore upload', err)
              }
              setPendingFile(null)
            }}
            onCancel={() => setPendingFile(null)}
          />
        )}
      </div>
    </>
  )
}

export default App