'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Calendar, Clock, Download } from 'lucide-react'

export default function VisualizarPonto({ onBack }) {
  const [pontos, setPontos] = useState([])
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // 1) Datas padrão (últimos 30 dias) + busca inicial
  useEffect(() => {
    const hoje = new Date()
    const trintaDiasAtras = new Date(hoje)
    trintaDiasAtras.setDate(hoje.getDate() - 30)

    const start = trintaDiasAtras.toISOString().split('T')[0]
    const end = hoje.toISOString().split('T')[0]

    setDataInicio(start)
    setDataFim(end)
    fetchPontos(start, end)
  }, [])

  // 2) API call
  async function fetchPontos(start = dataInicio, end = dataFim) {
    if (!start || !end) return
    try {
      const res = await fetch(`/api/ponto/report?start=${start}&end=${end}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Falha ao buscar pontos')
      const data = await res.json()
      setPontos(data)
    } catch (err) {
      console.error(err)
    }
  }

  // 3) Cálculo de horas trabalhadas
  function calcularHorasTrabalhadas(list) {
    const porDia = {}
    list.forEach(p => {
      porDia[p.data] = porDia[p.data] || []
      porDia[p.data].push(p)
    })
    return Object.entries(porDia)
      .map(([data, pts]) => {
        let horas = 0
        if (pts.length >= 2) horas = Math.min(pts.length * 2, 8)
        return { data, pontos: pts, horasTrabalhadas: horas }
      })
      .sort((a, b) => new Date(b.data) - new Date(a.data))
  }

  const dadosCalculados = calcularHorasTrabalhadas(pontos)

  // 4) Formatação de data
  function formatDate(dateString) {
    const d = new Date(dateString + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // 5) Exportar CSV
  function exportarDados() {
    const rows = [
      ['Data', 'Tipo', 'Horário'],
      ...pontos.map(p => [p.data, p.tipo, p.hora]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pontos_${dataInicio}_${dataFim}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Visualizar Pontos
          </h1>
        </div>
        {pontos.length > 0 && (
          <button
            onClick={exportarDados}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-2">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => fetchPontos()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
            >
              <Search className="w-4 h-4 mr-2" /> Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {dadosCalculados.length > 0 ? (
        <div className="space-y-4">
          {dadosCalculados.map(({ data, pontos, horasTrabalhadas }) => (
            <div key={data} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{formatDate(data)}</h3>
                  <p className="text-gray-600">
                    {horasTrabalhadas}h trabalhadas
                  </p>
                </div>
                <p className="text-gray-500">{pontos.length} registros</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pontos.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center bg-gray-50 p-3 rounded-lg"
                  >
                    <Clock className="w-4 h-4 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium">{p.tipo}</p>
                      <p className="text-gray-600 font-mono">{p.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum ponto encontrado</h3>
          <p className="text-gray-600">
            Não há registros de ponto no período selecionado.
          </p>
        </div>
      )}
    </div>
  )
}
