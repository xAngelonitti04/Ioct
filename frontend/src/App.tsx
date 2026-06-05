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

export interface Sensor {
  sensor_id?: number
  name: string
  sensor_type: string
  unit: string
  sensor_key: string
}

export interface IoCtNode {
  ioct_node_id?: number
  name: string
  status?: string
  serial_number?: string
  manufacturer?: string
  model?: string
  installation_date?: string
  notes?: string
  artemis_node_id?: string
  sensors?: Sensor[]
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
  asset_id?: number
  object_type?: string
  artemis_node_id?: string
  config: ModelConfig
  node?: IoCtNode
}

export async function loadProjectModels(project: Project): Promise<SceneModel[]> {
  try {
    const res = await fetch(`/api/scene-objects/project/${project.project_id}`)
    const objects = await res.json()
    if (!Array.isArray(objects) || objects.length === 0) return []

    return await Promise.all(objects.map(async (obj: any) => {
      let node: IoCtNode | undefined = undefined

      if (obj.object_type === 'iot_node') {
        if (obj.ioct_node_id) {
          try {
            const nRes = await fetch(`/api/ioct-nodes/${obj.ioct_node_id}`)
            const nData = await nRes.json()
            const sRes = await fetch(`/api/sensors/node/${obj.ioct_node_id}`)
            const sensors = await sRes.json()
            node = { ...nData, sensors }
          } catch (e) { console.error(e) }
        } else if (obj.artemis_node_id) {
          try {
            const nRes = await fetch(`/api/artemis/nodes/${obj.artemis_node_id}`)
            const nData = await nRes.json()
            node = {
              name: nData.name ?? nData._id,
              status: nData.status,
              artemis_node_id: nData._id,
              sensors: nData.capabilities?.sensors?.map((s: any) => ({
                name: s.name,
                sensor_type: s.type,
                unit: s.unit,
                sensor_key: s.sensorId,
              })) ?? [],
            }
          } catch (e) { console.error(e) }
        }
      }

      return {
        url: obj.object_type === 'iot_node'
          ? `/sensor.glb?t=${Date.now()}`
          : `/models/${project.project_id}/${obj.glb_filename}?t=${Date.now()}`,
        glb_filename: obj.glb_filename,
        scene_object_id: obj.scene_object_id,
        asset_id: obj.asset_id,
        object_type: obj.object_type,
        artemis_node_id: obj.artemis_node_id,
        config: {
          position: [obj.pos_x ?? 0, obj.pos_y ?? 0, obj.pos_z ?? 0] as [number, number, number],
          rotation: [obj.rot_x ?? 0, obj.rot_y ?? 0, obj.rot_z ?? 0] as [number, number, number],
          scale: [obj.scale_x ?? 1, obj.scale_y ?? 1, obj.scale_z ?? 1] as [number, number, number],
        },
        node,
      }
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
  const [pendingAssetId, setPendingAssetId] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedModelIndex, setSelectedModelIndex] = useState<number | null>(null)
  const [sceneKey, setSceneKey] = useState(0)
  const [placementMode, setPlacementMode] = useState(false)
  const [previewPosition, setPreviewPosition] = useState<[number, number, number] | null>(null)
  const [pendingPlacementNode, setPendingPlacementNode] = useState<IoCtNode | null>(null)
  const [pendingArtemisNodeId, setPendingArtemisNodeId] = useState<string | null>(null)
  const [xrayMode, setXrayMode] = useState(false)
  const [xrayAssetIndex, setXrayAssetIndex] = useState<number | null>(null)
  const [selectingXrayAsset, setSelectingXrayAsset] = useState(false)
  const isDragging = useRef(false)

  const fetchAssets = useAppStore((s: any) => s.fetchAssets)
  const fetchNodes  = useAppStore((s: any) => s.fetchNodes)

  useEffect(() => { fetchAssets(); fetchNodes() }, [])

  useEffect(() => {
    setSidebarOpen(activeTab !== 'scene')
  }, [activeTab])

  const handleTabChange = (tab: Tab) => {
    if (tab !== 'scene') setLastTab(tab)
    setActiveTab(tab)
    if (tab !== 'analytics') {
      setXrayMode(false)
      setXrayAssetIndex(null)
      setSelectingXrayAsset(false)
    }
  }

  const handleChangeProject = () => {
    setModels([])
    setSelectedModelIndex(null)
    setSceneKey(prev => prev + 1)
    setCurrentProject(null)
    setXrayMode(false)
    setXrayAssetIndex(null)
    setSelectingXrayAsset(false)
  }

  const handleSelectProject = async (project: Project) => {
    setModels([])
    setSelectedModelIndex(null)
    setSceneKey(prev => prev + 1)
    setCurrentProject(project)
    const loaded = await loadProjectModels(project)
    setModels(loaded)
  }

  const handleLoadGlb = (file: File, assetId: number) => {
    setPendingFile(file)
    setPendingAssetId(assetId)
  }

  const handleDeleteModel = async (index: number) => {
    const model = models[index]
    if (model.scene_object_id) {
      await fetch(`/api/scene-objects/${model.scene_object_id}`, { method: 'DELETE' })
    }
    setModels(prev => prev.filter((_, i) => i !== index))
    setSelectedModelIndex(null)
    if (xrayAssetIndex === index) {
      setXrayMode(false)
      setXrayAssetIndex(null)
      setSelectingXrayAsset(false)
    }
  }

  const handleDeleteNodeFromScene = (ioct_node_id: number) => {
    const toDelete = models.filter(m => m.node?.ioct_node_id === ioct_node_id)
    toDelete.forEach(async m => {
      if (m.scene_object_id) {
        await fetch(`/api/scene-objects/${m.scene_object_id}`, { method: 'DELETE' })
      }
    })
    setModels(prev => prev.filter(m => m.node?.ioct_node_id !== ioct_node_id))
  }

  const handleUpdatePosition = async (
    index: number,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => {
    const model = models[index]
    if (!model.scene_object_id) return
    await fetch(`/api/scene-objects/${model.scene_object_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pos_x: position[0], pos_y: position[1], pos_z: position[2],
        rot_x: rotation[0], rot_y: rotation[1], rot_z: rotation[2],
        scale_x: scale[0], scale_y: scale[1], scale_z: scale[2],
      }),
    })
    setModels(prev => prev.map((m, i) =>
      i === index ? { ...m, config: { position, rotation, scale } } : m
    ))
  }

  const handleAddNode = (modelIndex: number, node: IoCtNode) => {
    setModels(prev => prev.map((m, i) => i === modelIndex ? { ...m, node } : m))
  }

  const handleActivatePlacement = (node: IoCtNode | null, artemisNodeId: string | null) => {
    if (!node && !artemisNodeId) {
      setPlacementMode(false)
      setPreviewPosition(null)
      setPendingPlacementNode(null)
      setPendingArtemisNodeId(null)
      return
    }
    setPendingPlacementNode(node)
    setPendingArtemisNodeId(artemisNodeId)
    setPlacementMode(true)
    setPreviewPosition([0, 0, 0])
  }

  const handleUpdatePreviewPosition = (position: [number, number, number]) => {
    setPreviewPosition(position)
  }

  const handlePlaceNode = async (node: IoCtNode | null, artemisNodeId: string | null, position: [number, number, number]) => {
    try {
      const res = await fetch('/api/scene-objects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          glb_filename: 'sensor.glb',
          project_id: currentProject?.project_id,
          ioct_node_id: node?.ioct_node_id ?? null,
          artemis_node_id: artemisNodeId,
          object_type: 'iot_node',
          pos_x: position[0], pos_y: position[1], pos_z: position[2],
          rot_x: 0, rot_y: 0, rot_z: 0,
          scale_x: 1, scale_y: 1, scale_z: 1,
        }),
      })
      const saved = await res.json()

      let nodeWithSensors: IoCtNode | undefined = node ?? undefined
      if (node?.ioct_node_id) {
        const sRes = await fetch(`/api/sensors/node/${node.ioct_node_id}`)
        const sensors = await sRes.json()
        nodeWithSensors = { ...node, sensors }
      }

      setModels(prev => [...prev, {
        url: `/sensor.glb?t=${Date.now()}`,
        glb_filename: 'sensor.glb',
        scene_object_id: saved.scene_object_id,
        object_type: 'iot_node',
        artemis_node_id: artemisNodeId ?? undefined,
        node: nodeWithSensors,
        config: { position, rotation: [0, 0, 0], scale: [1, 1, 1] },
      }])
    } catch (err) {
      console.error('Errore posizionamento nodo', err)
    }
    setPlacementMode(false)
    setPreviewPosition(null)
    setPendingPlacementNode(null)
    setPendingArtemisNodeId(null)
  }

  const handlePlacementClick = (position: [number, number, number]) => {
    setPreviewPosition(position)
  }

  const handleImportProject = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        const res = await fetch('/api/projects/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.project.name,
            description: data.project.description || null,
            start_date: data.project.start_date || null,
            end_date: data.project.end_date || null,
            status: data.project.status || null,
          }),
        })
        const newProject = await res.json()
        await handleSelectProject(newProject)
      } catch (err) {
        console.error('Errore importazione:', err)
      }
    }
    reader.readAsText(file)
  }

  const selectedModelNode = selectedModelIndex !== null ? models[selectedModelIndex]?.node : undefined

  const onMouseDown = useCallback(() => { isDragging.current = true }, [])
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const newWidth = window.innerWidth - e.clientX
    if (newWidth > 150 && newWidth < 900) setSidebarWidth(newWidth)
  }, [])
  const onMouseUp = useCallback(() => { isDragging.current = false }, [])

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
        <ProjectStartModal onSelect={handleSelectProject} onImport={handleImportProject} />
      )}

      <div
        style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1a2e' }}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setIsDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
            setPendingFile(file)
            setPendingAssetId(null)
          }
        }}
      >
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentProject={currentProject}
          onChangeProject={handleChangeProject}
          models={models}
        />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <Scene3D
              key={sceneKey}
              models={models}
              onDelete={handleDeleteModel}
              activeTab={activeTab}
              onSelectModel={(index) => {
                setSelectedModelIndex(index)
                if (selectingXrayAsset && index !== null && models[index]?.object_type === 'asset') {
                  setXrayAssetIndex(index)
                  setSelectingXrayAsset(false)
                }
              }}
              onUpdatePosition={handleUpdatePosition}
              selectedModelIndex={selectedModelIndex}
              placementMode={placementMode}
              onPlacementClick={handlePlacementClick}
              previewPosition={previewPosition}
              xrayMode={xrayMode}
              xrayAssetIndex={xrayAssetIndex}
              selectingXrayAsset={selectingXrayAsset}
            />
          </div>

          <div style={{
            position: 'absolute', top: 0,
            right: sidebarOpen ? 0 : -sidebarWidth,
            width: sidebarWidth, height: '100%',
            background: '#16213e', overflowY: 'auto',
            transition: isDragging.current ? 'none' : 'right 0.3s ease',
            zIndex: 10,
          }}>
            <div
              onMouseDown={onMouseDown}
              style={{
                position: 'absolute', left: 0, top: 0,
                width: 4, height: '100%', cursor: 'ew-resize',
                background: 'rgba(255,255,255,0.05)', zIndex: 20,
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
              onSelectModel={(index) => {
                setSelectedModelIndex(index)
                if (selectingXrayAsset && index !== null && models[index]?.object_type === 'asset') {
                  setXrayAssetIndex(index)
                  setSelectingXrayAsset(false)
                }
              }}
              onLoadGlb={handleLoadGlb}
              onPlaceNode={handlePlaceNode}
              onActivatePlacement={handleActivatePlacement}
              onUpdatePreviewPosition={handleUpdatePreviewPosition}
              previewPosition={previewPosition}
              onDeleteNodeFromScene={handleDeleteNodeFromScene}
              xrayMode={xrayMode}
              xrayAssetIndex={xrayAssetIndex}
              onToggleXray={(active) => {
                setXrayMode(active)
                if (!active) {
                  setXrayAssetIndex(null)
                  setSelectingXrayAsset(false)
                }
              }}
              onStartSelectXrayAsset={() => setSelectingXrayAsset(true)}
              selectingXrayAsset={selectingXrayAsset}
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
              top: '50%', transform: 'translateY(-50%)',
              zIndex: 20, width: 20, height: 48,
              background: '#0f172a',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: '6px 0 0 6px', color: '#94a3b8',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 14, transition: 'right 0.3s ease',
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
            zIndex: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
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
                  method: 'POST', body: formData,
                })
                const { filename } = await uploadRes.json()
                const existingModel = pendingAssetId !== null
                  ? models.find(m => m.asset_id === pendingAssetId)
                  : null

                if (existingModel?.scene_object_id) {
                  await fetch(`/api/scene-objects/${existingModel.scene_object_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ glb_filename: filename }),
                  })
                  setModels(prev => prev.map(m =>
                    m.scene_object_id === existingModel.scene_object_id
                      ? { ...m, url: `/models/${currentProject?.project_id}/${filename}?t=${Date.now()}`, glb_filename: filename }
                      : m
                  ))
                } else {
                  const res = await fetch('/api/scene-objects/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      glb_filename: filename,
                      project_id: currentProject?.project_id,
                      asset_id: pendingAssetId,
                      object_type: 'asset',
                      pos_x: config.position[0], pos_y: config.position[1], pos_z: config.position[2],
                      rot_x: config.rotation[0], rot_y: config.rotation[1], rot_z: config.rotation[2],
                      scale_x: config.scale[0], scale_y: config.scale[1], scale_z: config.scale[2],
                    }),
                  })
                  const saved = await res.json()
                  setModels(prev => [...prev, {
                    url: `/models/${currentProject?.project_id}/${filename}?t=${Date.now()}`,
                    glb_filename: filename,
                    scene_object_id: saved.scene_object_id,
                    asset_id: pendingAssetId ?? undefined,
                    object_type: 'asset',
                    config,
                  }])
                }
              } catch (err) {
                console.error('Errore upload', err)
              }
              setPendingFile(null)
              setPendingAssetId(null)
            }}
            onCancel={() => { setPendingFile(null); setPendingAssetId(null) }}
          />
        )}
      </div>
    </>
  )
}

export default App