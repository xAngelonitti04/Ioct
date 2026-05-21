/// <reference types="@react-three/fiber" />
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Line, useGLTF, TransformControls } from '@react-three/drei'
import { Suspense, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

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
  config: ModelConfig
  node?: any
}

interface Scene3DProps {
  models: SceneModel[]
  onDelete: (index: number) => void
  activeTab: string
  onSelectModel: (index: number | null) => void
  onUpdatePosition: (index: number, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void
  selectedModelIndex: number | null
}

function Model({ url, config, modelRef, onSelect, interactive, selected }: {
  url: string
  config: ModelConfig
  modelRef: React.RefObject<THREE.Group> | { current: null }
  onSelect: () => void
  interactive: boolean
  selected: boolean
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
            new THREE.Color('#60a5fa')
          )}
        />
      )}
    </group>
  )
}

export function Scene3D({ models, onDelete, activeTab, onSelectModel, onUpdatePosition, selectedModelIndex }: Scene3DProps) {
  const modelRef = useRef<THREE.Group>(null)
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale' | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [, forceUpdate] = useState(0)

  const isScene = activeTab === 'scene'
  const isInteractive = activeTab === 'scene' || activeTab === 'nodes' || activeTab === 'assets'

  useEffect(() => {
    if (selectedModelIndex !== selectedIndex) {
      setSelectedIndex(selectedModelIndex)
      setTimeout(() => forceUpdate(n => n + 1), 100)
    }
  }, [selectedModelIndex])

  useEffect(() => {
    if (selectedIndex !== null) {
      const timer = setTimeout(() => forceUpdate(n => n + 1), 100)
      return () => clearTimeout(timer)
    }
  }, [selectedIndex])

  useEffect(() => {
    if (activeTab !== 'scene') {
      setMode(null)
    }
  }, [activeTab])

  const handleTransformEnd = () => {
    if (!modelRef.current || selectedIndex === null) return
    const pos = modelRef.current.position
    const rot = modelRef.current.rotation
    const scl = modelRef.current.scale
    onUpdatePosition(
      selectedIndex,
      [pos.x, pos.y, pos.z],
      [rot.x, rot.y, rot.z],
      [scl.x, scl.y, scl.z]
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {isScene && selectedIndex !== null && modelRef.current && (
        <div style={{
          position: 'absolute',
          top: 12, left: 12,
          zIndex: 10,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { id: 'translate', icon: 'ti-move',             label: 'Sposta' },
              { id: 'rotate',    icon: 'ti-rotate-clockwise', label: 'Ruota'  },
              { id: 'scale',     icon: 'ti-arrows-maximize',  label: 'Scala'  },
            ] as const).map(m => (
              <button
                key={m.id}
                onClick={() => setMode(prev => prev === m.id ? null : m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px',
                  background: mode === m.id ? 'rgba(59,130,246,0.3)' : '#0f172a',
                  border: `0.5px solid ${mode === m.id ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 6,
                  color: mode === m.id ? '#60a5fa' : '#94a3b8',
                  cursor: 'pointer', fontSize: 13,
                }}
              >
                <i className={`ti ${m.icon}`} style={{ fontSize: 16 }} />
                {m.label}
              </button>
            ))}
          </div>

          <div style={{ width: '0.5px', height: 24, background: 'rgba(255,255,255,0.15)' }} />

          <div style={{
            display: 'flex', gap: 8,
            padding: '6px 12px',
            background: '#0f172a',
            border: '0.5px solid rgba(255,255,255,0.15)',
            borderRadius: 6, fontSize: 12,
          }}>
            <span style={{ color: '#f87171' }}>X {modelRef.current.position.x.toFixed(2)}</span>
            <span style={{ color: '#4ade80' }}>Y {modelRef.current.position.y.toFixed(2)}</span>
            <span style={{ color: '#60a5fa' }}>Z {modelRef.current.position.z.toFixed(2)}</span>
          </div>

          <div style={{ width: '0.5px', height: 24, background: 'rgba(255,255,255,0.15)' }} />

          <button
            onClick={() => {
              onDelete(selectedIndex!)
              setSelectedIndex(null)
              setMode(null)
              onSelectModel(null)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              background: 'rgba(239,68,68,0.15)',
              border: '0.5px solid rgba(239,68,68,0.4)',
              borderRadius: 6, color: '#f87171',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: 16 }} />
            Elimina
          </button>
        </div>
      )}

      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        onPointerMissed={() => {
          if (!isInteractive) return
          setSelectedIndex(null)
          setMode(null)
          onSelectModel(null)
        }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, 10, -5]} intensity={0.5} />

        <Suspense fallback={null}>
          {models.map((m, i) => (
            <Model
              key={`${m.url}-${i}`}
              url={m.url}
              config={m.config}
              modelRef={i === selectedIndex ? modelRef : { current: null }}
              interactive={isInteractive}
              selected={i === selectedIndex}
              onSelect={() => {
                setSelectedIndex(i)
                onSelectModel(i)
                if (isScene) setMode('translate')
              }}
            />
          ))}
          {isScene && selectedIndex !== null && mode && modelRef.current && (
            <TransformControls
              object={modelRef.current}
              mode={mode}
              onMouseUp={handleTransformEnd}
            />
          )}
        </Suspense>

        <Line points={[[0,0,0],[5,0,0]]} color="red" lineWidth={3} />
        <Line points={[[0,0,0],[0,5,0]]} color="green" lineWidth={3} />
        <Line points={[[0,0,0],[0,0,5]]} color="blue" lineWidth={3} />

        <Grid
          args={[1000, 1000]}
          infiniteGrid
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1e40af"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#3b82f6"
          fadeDistance={200}
          fadeStrength={1}
        />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  )
}