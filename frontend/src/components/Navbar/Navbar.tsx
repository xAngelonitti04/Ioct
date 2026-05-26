import type { Project, SceneModel } from '../../App'
import { IotIcon } from '../IotIcon'

type Tab = 'scene' | 'analytics' | 'nodes' | 'assets' | 'projects'

interface NavbarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  currentProject: Project | null
  onChangeProject: () => void
  models: SceneModel[]
}

export function Navbar({ activeTab, onTabChange, currentProject, onChangeProject, models }: NavbarProps) {
  const tabs: { id: Tab; label: string; icon?: string; custom?: boolean }[] = [
    { id: 'scene',     label: 'Vista 3D',  icon: 'ti-box-model-2' },
    { id: 'analytics', label: 'Analytics', icon: 'ti-chart-line'  },
    { id: 'nodes',     label: 'Nodi IoT',  custom: true           },
    { id: 'assets',    label: 'Asset',     icon: 'ti-building'    },
    { id: 'projects',  label: 'Progetti',  icon: 'ti-folder'      },
  ]

  return (
    <nav style={{
      background: '#0f172a',
      borderBottom: '0.5px solid rgba(255,255,255,0.1)',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>

      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '15px', fontWeight: 500 }}>
          <div style={{ width: 28, height: 28, background: '#1d4ed8', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-building-castle" style={{ color: 'white', fontSize: 16 }} />
          </div>
          Ioct Viewer
        </div>

        {currentProject && (
          <>
            <div style={{ width: '0.5px', height: 24, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-folder" style={{ fontSize: 14, color: '#60a5fa' }} />
              <span style={{ color: '#60a5fa', fontSize: 13 }}>{currentProject.name}</span>
              <button
                onClick={onChangeProject}
                title="Cambia progetto"
                style={{
                  background: 'transparent', border: 'none',
                  color: '#475569', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <i className="ti ti-refresh" style={{ fontSize: 14 }} />
              </button>
            </div>
          </>
        )}

        <div style={{ width: '0.5px', height: 24, background: 'rgba(255,255,255,0.15)' }} />

        <div style={{ display: 'flex', gap: 2 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 6,
                fontSize: 13, cursor: 'pointer', border: 'none',
                background: activeTab === tab.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: activeTab === tab.id ? '#60a5fa' : '#94a3b8',
              }}
            >
              {tab.custom ? (
                <IotIcon size={16} color={activeTab === tab.id ? '#60a5fa' : '#94a3b8'} />
              ) : (
                <i className={`ti ${tab.icon}`} style={{ fontSize: 16 }} />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: 'rgba(16,185,129,0.12)',
          border: '0.5px solid rgba(16,185,129,0.3)',
          borderRadius: 20, fontSize: 12, color: '#34d399',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          {models.filter(m => m.node).length} nodi attivi
        </div>

        <button style={{ width: 32, height: 32, borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>
          <i className="ti ti-bell" />
        </button>
        <button style={{ width: 32, height: 32, borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>
          <i className="ti ti-settings" />
        </button>
      </div>
    </nav>
  )
}