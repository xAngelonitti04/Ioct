import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ScatterChart, Scatter, ZAxis
} from 'recharts'
import { Thermometer, Droplets, Wind, Sun, FlaskConical, Gauge, Radio, RefreshCw, ChevronUp, ChevronDown, Search, X } from 'lucide-react'

const ARTEMIS_BASE_URL = '/api/artemis'

interface Sensor {
  sensor_id?: number
  name: string
  sensor_type: string
  unit: string
  sensor_key: string
}

interface IoCtNode {
  ioct_node_id?: number
  name: string
  status?: string
  artemis_node_id?: string
  sensors?: Sensor[]
}

interface SensorReading {
  timestamp: string
  value: number
  unit: string
}

const SENSOR_RANGES: Record<string, { min: number, max: number, unit: string, label: string }> = {
  temperature: { min: 18, max: 28, unit: '°C', label: 'Temperatura' },
  humidity: { min: 40, max: 70, unit: '%', label: 'Umidità' },
  light: { min: 0, max: 200, unit: 'lx', label: 'Illuminazione' },
  co2: { min: 0, max: 1000, unit: 'ppm', label: 'CO₂' },
  pressure: { min: 980, max: 1030, unit: 'hPa', label: 'Pressione' },
  voc: { min: 0, max: 500, unit: 'ppb', label: 'VOC' },
}

function getSensorIcon(type: string, size = 14) {
  const props = { size, strokeWidth: 1.5 }
  switch (type) {
    case 'temperature': return <Thermometer {...props} />
    case 'humidity': return <Droplets {...props} />
    case 'co2': return <Wind {...props} />
    case 'light': return <Sun {...props} />
    case 'voc': return <FlaskConical {...props} />
    case 'pressure': return <Gauge {...props} />
    default: return <Radio {...props} />
  }
}

function getSensorColor(type: string) {
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

function getTrend(data: SensorReading[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable'
  const diff = data[data.length - 1].value - data[data.length - 2].value
  if (Math.abs(diff) < 0.5) return 'stable'
  return diff > 0 ? 'up' : 'down'
}

function isInRange(value: number, type: string): 'ok' | 'warning' | 'critical' {
  const range = SENSOR_RANGES[type]
  if (!range) return 'ok'
  if (value < range.min || value > range.max) return 'critical'
  const margin = (range.max - range.min) * 0.1
  if (value < range.min + margin || value > range.max - margin) return 'warning'
  return 'ok'
}

function calcStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length)
}

function calcAlertEpisodes(data: SensorReading[], type: string) {
  const range = SENSOR_RANGES[type]
  if (!range || data.length === 0) return { count: 0, avgDuration: 0 }
  let episodes = 0, totalDuration = 0, inEpisode = false
  let episodeStart: Date | null = null
  data.forEach(d => {
    const out = d.value < range.min || d.value > range.max
    if (out && !inEpisode) { inEpisode = true; episodeStart = new Date(d.timestamp); episodes++ }
    else if (!out && inEpisode) { inEpisode = false; if (episodeStart) totalDuration += new Date(d.timestamp).getTime() - episodeStart.getTime() }
  })
  return { count: episodes, avgDuration: episodes > 0 ? Math.round(totalDuration / episodes / 60000) : 0 }
}

function generateSimulatedHistory(currentValue: number, count: number): SensorReading[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
    value: parseFloat((currentValue + (Math.random() - 0.5) * 2).toFixed(2)),
    unit: '',
  }))
}

function SensorAnalysis({ sensor, nodeId, isSimulated, allSensors, allData }: {
  sensor: Sensor
  nodeId: string
  isSimulated: boolean
  allSensors: Sensor[]
  allData: Record<string, SensorReading[]>
}) {
  const [history, setHistory] = useState<SensorReading[]>([])
  const [latest, setLatest] = useState<SensorReading | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [activeAnalysis, setActiveAnalysis] = useState<'storico' | 'stats' | 'correlazione' | 'alert'>('storico')
  const [pageSize, setPageSize] = useState(50)

  useEffect(() => { if (expanded) fetchData() }, [expanded, pageSize])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (isSimulated) {
        const ioct_node_id = nodeId.replace('local-', '')
        const res = await fetch(`${ARTEMIS_BASE_URL}/simulate/${ioct_node_id}/data`)
        const data = await res.json()
        const reading = data.data?.find((d: any) => d.sensorId === sensor.sensor_type)
        if (reading) {
          const lat: SensorReading = { timestamp: reading.payload.timestamp, value: reading.payload.value, unit: reading.payload.unit }
          setLatest(lat)
          setHistory(generateSimulatedHistory(lat.value, pageSize))
        }
      } else {
        const [latestRes, historyRes] = await Promise.all([
          fetch(`${ARTEMIS_BASE_URL}/nodes/${nodeId}/data?op=latest&type=scalar&sensorId=${sensor.sensor_key}`),
          fetch(`${ARTEMIS_BASE_URL}/nodes/${nodeId}/data?op=query&type=scalar&sensorId=${sensor.sensor_key}&pageSize=${pageSize}`),
        ])
        const latestData = await latestRes.json()
        const historyData = await historyRes.json()
        if (latestData.data?.[0]) {
          setLatest({ timestamp: latestData.data[0].payload.timestamp, value: latestData.data[0].payload.value, unit: latestData.data[0].payload.unit })
        }
        if (historyData.data) {
          setHistory(historyData.data
            .map((d: any) => ({ timestamp: d.payload.timestamp, value: d.payload.value, unit: d.payload.unit }))
            .sort((a: SensorReading, b: SensorReading) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          )
        }
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const range = SENSOR_RANGES[sensor.sensor_type]
  const status = latest ? isInRange(latest.value, sensor.sensor_type) : 'ok'
  const trend = getTrend(history)
  const color = getSensorColor(sensor.sensor_type)
  const values = history.map(d => d.value)
  const min = values.length > 0 ? Math.min(...values) : null
  const max = values.length > 0 ? Math.max(...values) : null
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
  const stdDev = calcStdDev(values)
  const outOfRange = values.filter(v => range && (v < range.min || v > range.max)).length
  const outOfRangePercent = values.length > 0 ? Math.round((outOfRange / values.length) * 100) : 0
  const inRangePercent = 100 - outOfRangePercent
  const alertEpisodes = calcAlertEpisodes(history, sensor.sensor_type)
  const statusColor = status === 'ok' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#f87171'
  const statusLabel = status === 'ok' ? 'Ottimale' : status === 'warning' ? 'Attenzione' : 'Critico'
  const chartData = history.map(d => ({
    time: new Date(d.timestamp).toLocaleString('it-IT', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    value: d.value,
  }))

  const corrSensor = allSensors.find(s =>
    sensor.sensor_type === 'temperature' ? s.sensor_type === 'humidity' :
    sensor.sensor_type === 'humidity' ? s.sensor_type === 'temperature' : null
  )
  const corrKey = corrSensor?.sensor_key || corrSensor?.sensor_type || ''
  const corrData = corrSensor && allData[corrKey]
    ? history.map((d, i) => { const match = allData[corrKey][i]; if (!match) return null; return { x: d.value, y: match.value } }).filter(Boolean)
    : []

  const tabStyle = (active: boolean) => ({
    padding: '4px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 4,
    background: active ? 'rgba(59,130,246,0.2)' : 'transparent',
    border: `0.5px solid ${active ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
    color: active ? '#60a5fa' : '#475569',
    display: 'flex', alignItems: 'center', gap: 4,
  })

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `0.5px solid ${status === 'critical' ? 'rgba(248,113,113,0.4)' : status === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10, overflow: 'hidden', marginBottom: 8,
    }}>
      <div style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: color }}>{getSensorIcon(sensor.sensor_type, 18)}</span>
          <div>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{sensor.name}</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>{range?.label ?? sensor.sensor_type}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {latest && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                {latest.value.toFixed(1)}
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 3 }}>{latest.unit === 'pct' ? '%' : latest.unit}</span>
              </div>
              <div style={{ color: statusColor, fontSize: 10 }}>{statusLabel}</div>
            </div>
          )}
          <span style={{ color: trend === 'up' ? '#f87171' : trend === 'down' ? '#60a5fa' : '#94a3b8', fontSize: 16 }}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
          {expanded ? <ChevronUp size={14} strokeWidth={1.5} color="#475569" /> : <ChevronDown size={14} strokeWidth={1.5} color="#475569" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 4, marginTop: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveAnalysis('storico')} style={tabStyle(activeAnalysis === 'storico')}>📈 Storico</button>
            <button onClick={() => setActiveAnalysis('stats')} style={tabStyle(activeAnalysis === 'stats')}>📊 Statistiche</button>
            {corrSensor && <button onClick={() => setActiveAnalysis('correlazione')} style={tabStyle(activeAnalysis === 'correlazione')}>🔗 Correlazione</button>}
            <button onClick={() => setActiveAnalysis('alert')} style={tabStyle(activeAnalysis === 'alert')}>⚠️ Alert</button>
            <button onClick={fetchData} style={{ ...tabStyle(false), marginLeft: 'auto' }}>
              <RefreshCw size={10} strokeWidth={1.5} />
            </button>
          </div>

          {loading ? (
            <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Caricamento...</div>
          ) : (
            <>
              {activeAnalysis === 'storico' && (
                <div>
                  {!isSimulated && (
                    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                      {[20, 50, 100].map(n => (
                        <button key={n} onClick={() => setPageSize(n)} style={tabStyle(pageSize === n)}>{n} mis.</button>
                      ))}
                    </div>
                  )}
                  {isSimulated && <div style={{ color: '#475569', fontSize: 10, marginBottom: 8 }}>Dati simulati</div>}
                  {chartData.length === 0 ? (
                    <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Nessun dato</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`grad-${sensor.sensor_type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#475569' }} interval={Math.floor(chartData.length / 4)} />
                        <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }} itemStyle={{ color }} />
                        {range && <ReferenceLine y={range.min} stroke="#f87171" strokeDasharray="3 3" strokeOpacity={0.5} />}
                        {range && <ReferenceLine y={range.max} stroke="#f87171" strokeDasharray="3 3" strokeOpacity={0.5} />}
                        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${sensor.sensor_type})`} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {activeAnalysis === 'stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { label: 'Min', value: min?.toFixed(2), color: '#60a5fa' },
                      { label: 'Max', value: max?.toFixed(2), color: '#f87171' },
                      { label: 'Media', value: avg?.toFixed(2), color: '#34d399' },
                      { label: 'Dev. std', value: stdDev.toFixed(2), color: '#a78bfa' },
                    ].map(s => (
                      <div key={s.label} style={{ flex: 1, padding: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 6 }}>
                        <div style={{ color: s.color, fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{s.value ?? '—'}</div>
                        <div style={{ color: '#475569', fontSize: 10 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>Tempo in range ottimale</span>
                      <span style={{ fontSize: 11, color: inRangePercent >= 80 ? '#10b981' : inRangePercent >= 60 ? '#f59e0b' : '#f87171', fontWeight: 600 }}>{inRangePercent}%</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${inRangePercent}%`, background: inRangePercent >= 80 ? '#10b981' : inRangePercent >= 60 ? '#f59e0b' : '#f87171', borderRadius: 4 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>Stabilità</span>
                      <span style={{ fontSize: 11, color: stdDev < 1 ? '#10b981' : stdDev < 2 ? '#f59e0b' : '#f87171', fontWeight: 600 }}>
                        {stdDev < 1 ? 'Alta' : stdDev < 2 ? 'Media' : 'Bassa'}
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(0, 100 - stdDev * 20)}%`, background: stdDev < 1 ? '#10b981' : stdDev < 2 ? '#f59e0b' : '#f87171', borderRadius: 4 }} />
                    </div>
                  </div>
                  {range && (
                    <div>
                      <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>POSIZIONE NEL RANGE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#60a5fa', fontSize: 11 }}>{range.min}</span>
                        <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #f87171 0%, #10b981 20%, #10b981 80%, #f87171 100%)', opacity: 0.2 }} />
                          {latest && (
                            <div style={{
                              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                              left: `${Math.max(0, Math.min(100, ((latest.value - range.min) / (range.max - range.min)) * 100))}%`,
                              width: 12, height: 12, borderRadius: '50%',
                              background: statusColor, border: '2px solid white', marginLeft: -6,
                            }} />
                          )}
                        </div>
                        <span style={{ color: '#f87171', fontSize: 11 }}>{range.max}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ color: '#475569', fontSize: 10, textAlign: 'right' }}>
                    {values.length} misurazioni {isSimulated && '(simulate)'}
                  </div>
                </div>
              )}

              {activeAnalysis === 'correlazione' && corrSensor && (
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
                    Correlazione <span style={{ color }}>{sensor.name}</span> / <span style={{ color: getSensorColor(corrSensor.sensor_type) }}>{corrSensor.name}</span>
                  </div>
                  {corrData.length === 0 ? (
                    <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Dati insufficienti</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={140}>
                      <ScatterChart margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="x" tick={{ fontSize: 9, fill: '#475569' }} />
                        <YAxis dataKey="y" tick={{ fontSize: 9, fill: '#475569' }} />
                        <ZAxis range={[20, 20]} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }} />
                        <Scatter data={corrData} fill={color} fillOpacity={0.7} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {activeAnalysis === 'alert' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { label: 'Episodi', value: alertEpisodes.count, color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
                      { label: 'Durata media', value: `${alertEpisodes.avgDuration}m`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
                      { label: 'Critici', value: `${outOfRangePercent}%`, color: outOfRangePercent > 0 ? '#f87171' : '#10b981', bg: outOfRangePercent > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.1)', border: outOfRangePercent > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(16,185,129,0.2)' },
                    ].map(s => (
                      <div key={s.label} style={{ flex: 1, padding: '10px', background: s.bg, border: `0.5px solid ${s.border}`, borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ color: s.color, fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                        <div style={{ color: '#475569', fontSize: 10 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#475569' }} interval={Math.floor(chartData.length / 4)} />
                        <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }} />
                        {range && <ReferenceLine y={range.min} stroke="#f87171" strokeWidth={2} strokeDasharray="4 2" />}
                        {range && <ReferenceLine y={range.max} stroke="#f87171" strokeWidth={2} strokeDasharray="4 2" />}
                        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.1} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  {alertEpisodes.count === 0 && (
                    <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '0.5px solid rgba(16,185,129,0.2)', borderRadius: 8, color: '#10b981', fontSize: 12, textAlign: 'center' }}>
                      Nessun episodio critico rilevato
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function NodeAnalytics({ node }: { node: IoCtNode }) {
  const [expanded, setExpanded] = useState(true)
  const [allData, setAllData] = useState<Record<string, SensorReading[]>>({})

  const isSimulated = !node.artemis_node_id
  const nodeId = node.artemis_node_id ?? `local-${node.ioct_node_id}`
  const sensors = node.sensors ?? []

  useEffect(() => {
    if (!isSimulated && sensors.length > 0) fetchAllData()
  }, [])

  const fetchAllData = async () => {
    const results: Record<string, SensorReading[]> = {}
    await Promise.all(sensors.filter(s => s.sensor_key).map(async s => {
      try {
        const res = await fetch(`${ARTEMIS_BASE_URL}/nodes/${node.artemis_node_id}/data?op=query&type=scalar&sensorId=${s.sensor_key}&pageSize=50`)
        const data = await res.json()
        if (data.data) {
          results[s.sensor_key] = data.data
            .map((d: any) => ({ timestamp: d.payload.timestamp, value: d.payload.value, unit: d.payload.unit }))
            .sort((a: SensorReading, b: SensorReading) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        }
      } catch (e) { console.error(e) }
    }))
    setAllData(results)
  }

  if (sensors.length === 0) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'pointer', padding: '8px 0' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.status === 'active' ? '#10b981' : '#475569' }} />
          <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{node.name}</span>
          {node.artemis_node_id
            ? <span style={{ color: '#facc15', fontSize: 10, background: 'rgba(234,179,8,0.1)', padding: '2px 6px', borderRadius: 4 }}>ARTEMIS</span>
            : <span style={{ color: '#34d399', fontSize: 10, background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4 }}>SIM</span>
          }
          <span style={{ color: '#475569', fontSize: 11 }}>· {sensors.length} sensori</span>
        </div>
        {expanded ? <ChevronUp size={14} strokeWidth={1.5} color="#475569" /> : <ChevronDown size={14} strokeWidth={1.5} color="#475569" />}
      </div>

      {expanded && sensors.map(s => (
        <SensorAnalysis
          key={s.sensor_key || s.sensor_type}
          sensor={s}
          nodeId={nodeId}
          isSimulated={isSimulated}
          allSensors={sensors}
          allData={allData}
        />
      ))}
    </div>
  )
}

export function AnalyticsPanel() {
  const [nodes, setNodes] = useState<IoCtNode[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchNodes() }, [])

  const fetchNodes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ioct-nodes/')
      const data = await res.json()
      const nodesWithSensors = await Promise.all(data.map(async (n: IoCtNode) => {
        const sRes = await fetch(`/api/sensors/node/${n.ioct_node_id}`)
        const sensors = await sRes.json()
        return { ...n, sensors }
      }))
      setNodes(nodesWithSensors)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = nodes
    .filter(n => n.sensors && n.sensors.length > 0)
    .filter(n => !search ||
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.artemis_node_id?.toLowerCase().includes(search.toLowerCase()) ||
      n.ioct_node_id?.toString().includes(search)
    )

  return (
    <div style={{ padding: '1rem', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: 16, fontWeight: 500 }}>Analytics</h2>
        <button
          onClick={fetchNodes}
          style={{ padding: '5px 10px', background: 'rgba(59,130,246,0.15)', border: '0.5px solid rgba(59,130,246,0.3)', borderRadius: 6, color: '#60a5fa', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <RefreshCw size={12} strokeWidth={1.5} />Aggiorna
        </button>
      </div>

      {/* Ricerca */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={13} strokeWidth={1.5} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per nome o ID..."
          style={{
            width: '100%', padding: '7px 32px',
            background: '#0f172a',
            border: '0.5px solid rgba(255,255,255,0.15)',
            borderRadius: 6, color: 'white', fontSize: 13,
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer' }}>
            <X size={13} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '2rem' }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#475569', fontSize: 13, textAlign: 'center' }}>
          {search ? `Nessun nodo trovato per "${search}"` : 'Nessun nodo con sensori disponibile'}
        </div>
      ) : (
        filtered.map(n => <NodeAnalytics key={n.ioct_node_id} node={n} />)
      )}
    </div>
  )
}