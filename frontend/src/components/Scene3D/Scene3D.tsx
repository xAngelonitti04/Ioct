/// <reference types="@react-three/fiber" />
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Line, useGLTF, TransformControls, Html } from '@react-three/drei'
import { Suspense, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

interface Sensor {
  sensor_id?: number
  name: string
  sensor_type: string
  unit: string
  sensor_key: string
  last_communication?: string | null
}

interface IoCtNode {
  ioct_node_id?: number
  name: string
  status?: string
  artemis_node_id?: string
  sensors?: Sensor[]
}

interface ModelConfig {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

interface SceneModel {
  url: string
  glb_filename?: string
  scene_object_id?: number
  asset_id?: number
  object_type?: string
  artemis_node_id?: string
  config: ModelConfig
  node?: IoCtNode
}

interface Scene3DProps {
  models: SceneModel[]
  onDelete: (index: number) => void
  activeTab: string
  onSelectModel: (index: number | null) => void
  onUpdatePosition: (index: number, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void
  selectedModelIndex: number | null
  placementMode: boolean
  onPlacementClick: (position: [number, number, number]) => void
  previewPosition: [number, number, number] | null
}

function NodeCard({ node, visible, position }: { node: IoCtNode, visible: boolean, position: [number, number, number] }) {
  const [sensorData, setSensorData] = useState<Record<string, { value: number, unit: string, timestamp: string }>>({})
  const [nodeDetails, setNodeDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchSensorData = async () => {
    setLoading(true)
    try {
      if (node.artemis_node_id) {
        const [dataRes, detailRes] = await Promise.all([
          fetch(`/api/artemis/nodes/${node.artemis_node_id}/data?op=latest&type=all`),
          fetch(`/api/artemis/nodes/${node.artemis_node_id}`),
        ])
        const data = await dataRes.json()
        const nData = await detailRes.json()
        const mapped: Record<string, { value: number, unit: string, timestamp: string }> = {}
        data.data?.forEach((d: any) => {
          mapped[d.sensorId] = {
            value: d.payload.value,
            unit: d.payload.unit,
            timestamp: d.payload.timestamp,
          }
        })
        setSensorData(mapped)
        setNodeDetails(nData)
      } else if (node.ioct_node_id) {
        const res = await fetch(`/api/artemis/simulate/${node.ioct_node_id}/data`)
        const data = await res.json()
        const mapped: Record<string, { value: number, unit: string, timestamp: string }> = {}
        data.data?.forEach((d: any) => {
          mapped[d.sensorId] = {
            value: d.payload.value,
            unit: d.payload.unit,
            timestamp: d.payload.timestamp,
          }
        })
        setSensorData(mapped)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!visible) return
    fetchSensorData()
    const interval = setInterval(fetchSensorData, 30000)
    return () => clearInterval(interval)
  }, [visible, node.artemis_node_id, node.ioct_node_id])

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return '🌡️'
      case 'humidity': return '💧'
      case 'co2': return '💨'
      case 'light': return '💡'
      case 'voc': return '🧪'
      case 'pressure': return '📊'
      default: return '📡'
    }
  }

  const getSensorColor = (type: string) => {
    switch (type) {
      case 'temperature': return '#f87171'
      case 'humidity': return '#60a5fa'
      case 'co2': return '#a78bfa'
      case 'light': return '#fbbf24'
      case 'voc': return '#34d399'
      case 'pressure': return '#fb923c'
      default: return '#94a3b8'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'maintenance': return '#f59e0b'
      default: return '#475569'
    }
  }

  return (
    <Html
      position={[position[0], position[1] + 2.5, position[2]]}
      center
      distanceFactor={10}
      zIndexRange={[0, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        background: 'rgba(8, 14, 28, 0.97)',
        border: '1px solid rgba(59,130,246,0.5)',
        borderRadius: 14,
        padding: '14px 18px',
        minWidth: 240,
        boxShadow: '0 0 30px rgba(59,130,246,0.25)',
        backdropFilter: 'blur(20px)',
        transform: visible ? 'scale(1)' : 'scale(0)',
        transformOrigin: 'bottom center',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        opacity: visible ? 1 : 0,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, borderBottom: '0.5px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: getStatusColor(node.status), boxShadow: `0 0 8px ${getStatusColor(node.status)}` }} />
          <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{node.name}</span>
          {!node.artemis_node_id && (
            <span style={{ color: '#34d399', fontSize: 9, background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4 }}>SIM</span>
          )}
        </div>

        {node.artemis_node_id && (
          <div style={{ color: '#facc15', fontSize: 9, marginBottom: 10 }}>
            ARTEMIS · {node.artemis_node_id}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>Caricamento...</div>
        ) : node.sensors && node.sensors.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {node.sensors.map((s, i) => {
              const key = s.sensor_key || s.sensor_type
              const data = sensorData[key]
              const color = getSensorColor ? getSensorColor(s.sensor_type) : 'white'
              const lastComm = s.last_communication ?? data?.timestamp ?? null
              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  gap: 3,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{getSensorIcon(s.sensor_type)}</span>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>{s.name}</span>
                    </div>
                    <span style={{ color: data ? color : '#334155', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                      {data ? `${data.value.toFixed(1)}${data.unit === 'pct' ? '%' : data.unit}` : '—'}
                    </span>
                  </div>
                  {lastComm && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#334155', fontSize: 9 }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {new Date(lastComm).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ color: '#334155', fontSize: 12, textAlign: 'center' }}>Nessun sensore</div>
        )}

        {Object.values(sensorData).length > 0 && (
          <div style={{ color: '#334155', fontSize: 9, textAlign: 'right', marginTop: 8 }}>
            🕐 {new Date(Object.values(sensorData)[0]?.timestamp ?? '').toLocaleString('it-IT')}
          </div>
        )}

        {nodeDetails && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {nodeDetails.operationalFlags?.maintenanceRequired && (
              <span style={{ color: '#f59e0b', fontSize: 9, background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4 }}>⚠️ Manutenzione</span>
            )}
            {nodeDetails.operationalFlags?.isCalibrated && (
              <span style={{ color: '#10b981', fontSize: 9, background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4 }}>✓ Calibrato</span>
            )}
            {nodeDetails.simulatedNode && (
              <span style={{ color: '#60a5fa', fontSize: 9, background: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: 4 }}>🔵 Simulato</span>
            )}
            {nodeDetails.location?.position?.room && (
              <span style={{ color: '#475569', fontSize: 9, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>📍 {nodeDetails.location.position.room}</span>
            )}
          </div>
        )}

        <button
          onClick={fetchSensorData}
          style={{
            width: '100%', marginTop: 10, padding: '5px',
            background: 'rgba(59,130,246,0.1)',
            border: '0.5px solid rgba(59,130,246,0.2)',
            borderRadius: 6, color: '#3b82f6',
            cursor: 'pointer', fontSize: 10,
            pointerEvents: 'auto',
          }}
        >
          ↻ Aggiorna dati
        </button>
      </div>
    </Html>
  )
}

function PlacementHandler({ onPlacementClick }: { onPlacementClick: (pos: [number, number, number]) => void }) {
  const { camera, gl } = useThree()
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const target = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, target)
      onPlacementClick([target.x, 0, target.z])
    }
    gl.domElement.addEventListener('click', handleClick)
    return () => gl.domElement.removeEventListener('click', handleClick)
  }, [camera, gl, onPlacementClick])
  return null
}

function PreviewSensor({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF('/sensor.glb')
  const clone = scene.clone()
  return <primitive object={clone} position={position} scale={[1, 1, 1]} />
}

function Model({ url, config, modelRef, onSelect, interactive, selected, node, showCard, isNodesTab }: {
  url: string
  config: ModelConfig
  modelRef: React.RefObject<THREE.Group> | { current: null }
  onSelect: () => void
  interactive: boolean
  selected: boolean
  node?: IoCtNode
  showCard: boolean
  isNodesTab: boolean
}) {
  const { scene } = useGLTF(url)
  const rad = (deg: number) => (deg * Math.PI) / 180

  useEffect(() => {
    return () => { useGLTF.clear(url) }
  }, [url])

  return (
    <group>
      <primitive
        ref={modelRef}
        object={scene}
        position={config?.position ?? [0, 0, 0]}
        rotation={config ? [rad(config.rotation[0]), rad(config.rotation[1]), rad(config.rotation[2])] : [0, 0, 0]}
        scale={config?.scale ?? [1, 1, 1]}
        onClick={(e: any) => {
          if (!interactive) return
          e.stopPropagation()
          onSelect()
        }}
      />
      {selected && (modelRef as React.RefObject<THREE.Group>).current && (
        <primitive
          object={new THREE.Box3Helper(
            new THREE.Box3().setFromObject((modelRef as React.RefObject<THREE.Group>).current!),
            new THREE.Color(isNodesTab ? '#10b981' : '#60a5fa')
          )}
        />
      )}
      {node && isNodesTab && (
        <NodeCard
          node={node}
          visible={showCard}
          position={config?.position ?? [0, 0, 0]}
        />
      )}
    </group>
  )
}

export function Scene3D({ models, onDelete, activeTab, onSelectModel, onUpdatePosition, selectedModelIndex, placementMode, onPlacementClick, previewPosition }: Scene3DProps) {
  const modelRef = useRef<THREE.Group>(null)
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale' | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [, forceUpdate] = useState(0)
  const [editPos, setEditPos] = useState({ x: '0', y: '0', z: '0' })

  const isScene = activeTab === 'scene'
  const isNodesTab = activeTab === 'nodes' || activeTab === 'analytics'
  const isInteractive = !placementMode && (activeTab === 'scene' || activeTab === 'nodes' || activeTab === 'assets' || activeTab === 'analytics')

  useEffect(() => {
    if (selectedModelIndex !== selectedIndex) {
      setSelectedIndex(selectedModelIndex)
      setTimeout(() => forceUpdate(n => n + 1), 100)
    }
  }, [selectedModelIndex])

  useEffect(() => {
    if (selectedIndex !== null) {
      const timer = setTimeout(() => {
        forceUpdate(n => n + 1)
        if (modelRef.current) {
          setEditPos({
            x: modelRef.current.position.x.toFixed(2),
            y: modelRef.current.position.y.toFixed(2),
            z: modelRef.current.position.z.toFixed(2),
          })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [selectedIndex])

  useEffect(() => {
    if (activeTab !== 'scene') setMode(null)
  }, [activeTab])

  const handleTransformEnd = () => {
    if (!modelRef.current || selectedIndex === null) return
    const pos = modelRef.current.position
    const rot = modelRef.current.rotation
    const scl = modelRef.current.scale
    setEditPos({ x: pos.x.toFixed(2), y: pos.y.toFixed(2), z: pos.z.toFixed(2) })
    onUpdatePosition(selectedIndex, [pos.x, pos.y, pos.z], [rot.x, rot.y, rot.z], [scl.x, scl.y, scl.z])
  }

  const handlePosInput = (axis: 'x' | 'y' | 'z', value: string) => {
    setEditPos(prev => ({ ...prev, [axis]: value }))
    const num = parseFloat(value)
    if (isNaN(num) || !modelRef.current || selectedIndex === null) return
    modelRef.current.position[axis] = num
    const pos = modelRef.current.position
    const rot = modelRef.current.rotation
    const scl = modelRef.current.scale
    onUpdatePosition(selectedIndex, [pos.x, pos.y, pos.z], [rot.x, rot.y, rot.z], [scl.x, scl.y, scl.z])
    forceUpdate(n => n + 1)
  }

  const inputStyle = {
    width: 60, padding: '4px 6px',
    background: '#0f172a', border: '0.5px solid rgba(255,255,255,0.15)',
    borderRadius: 4, color: 'white', fontSize: 12, textAlign: 'center' as const,
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {placementMode && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, padding: '8px 16px',
          background: 'rgba(234,179,8,0.2)', border: '0.5px solid rgba(234,179,8,0.5)',
          borderRadius: 8, color: '#facc15', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none',
        }}>
          <i className="ti ti-map-pin" style={{ fontSize: 16 }} />
          Clicca sulla scena per posizionare il sensore
        </div>
      )}

      {isScene && selectedIndex !== null && modelRef.current && (
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 10,
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { id: 'translate', icon: 'ti-move', label: 'Sposta' },
              { id: 'rotate', icon: 'ti-rotate-clockwise', label: 'Ruota' },
              { id: 'scale', icon: 'ti-arrows-maximize', label: 'Scala' },
            ] as const).map(m => (
              <button key={m.id} onClick={() => setMode(prev => prev === m.id ? null : m.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: mode === m.id ? 'rgba(59,130,246,0.3)' : '#0f172a',
                border: `0.5px solid ${mode === m.id ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 6, color: mode === m.id ? '#60a5fa' : '#94a3b8', cursor: 'pointer', fontSize: 13,
              }}>
                <i className={`ti ${m.icon}`} style={{ fontSize: 16 }} />{m.label}
              </button>
            ))}
          </div>

          <div style={{ width: '0.5px', height: 24, background: 'rgba(255,255,255,0.15)' }} />

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '4px 10px', background: '#0f172a', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 6 }}>
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: axis === 'x' ? '#f87171' : axis === 'y' ? '#4ade80' : '#60a5fa', fontSize: 11, fontWeight: 600 }}>
                  {axis.toUpperCase()}
                </span>
                <input type="number" step="0.1" value={editPos[axis]} onChange={e => handlePosInput(axis, e.target.value)} style={inputStyle} />
              </div>
            ))}
          </div>

          <div style={{ width: '0.5px', height: 24, background: 'rgba(255,255,255,0.15)' }} />

          <button
            onClick={() => { onDelete(selectedIndex!); setSelectedIndex(null); setMode(null); onSelectModel(null) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(239,68,68,0.15)', border: '0.5px solid rgba(239,68,68,0.4)', borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: 13 }}
          >
            <i className="ti ti-trash" style={{ fontSize: 16 }} />Elimina
          </button>
        </div>
      )}

      <Canvas
        style={{ cursor: placementMode ? 'crosshair' : 'default' }}
        camera={{ position: [10, 10, 10], fov: 50 }}
        onPointerMissed={() => {
          if (!isInteractive) return
          setSelectedIndex(null); setMode(null); onSelectModel(null)
        }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, 10, -5]} intensity={0.5} />

        {placementMode && <PlacementHandler onPlacementClick={onPlacementClick} />}

        <Suspense fallback={null}>
          {models.map((m, i) => (
            <Model
              key={`${m.url}-${i}`}
              url={m.url}
              config={m.config}
              modelRef={i === selectedIndex ? modelRef : { current: null }}
              interactive={isInteractive}
              selected={i === selectedIndex}
              node={m.node}
              showCard={i === selectedIndex && isNodesTab}
              isNodesTab={isNodesTab}
              onSelect={() => {
                setSelectedIndex(i)
                onSelectModel(i)
                if (isScene) setMode('translate')
              }}
            />
          ))}

          {placementMode && previewPosition && (
            <PreviewSensor position={previewPosition} />
          )}

          {isScene && selectedIndex !== null && mode && modelRef.current && (
            <TransformControls object={modelRef.current} mode={mode} onMouseUp={handleTransformEnd} />
          )}
        </Suspense>

        <Line points={[[0,0,0],[5,0,0]]} color="red" lineWidth={3} />
        <Line points={[[0,0,0],[0,5,0]]} color="green" lineWidth={3} />
        <Line points={[[0,0,0],[0,0,5]]} color="blue" lineWidth={3} />

        <Grid
          args={[1000, 1000]} infiniteGrid
          cellSize={1} cellThickness={0.5} cellColor="#1e40af"
          sectionSize={5} sectionThickness={1} sectionColor="#3b82f6"
          fadeDistance={200} fadeStrength={1}
        />

        <OrbitControls makeDefault enabled={!placementMode} />
      </Canvas>
    </div>
  )
}