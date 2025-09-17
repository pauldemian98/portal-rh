'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react'

export default function RegistrarPonto({ onBack }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [pontos, setPontos] = useState([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [lastRegistration, setLastRegistration] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // 1) Busca os pontos registrados hoje
  const fetchPontosHoje = async () => {
    setError(null)
    try {
      const response = await fetch('/api/ponto/visualizar', { cache: 'no-store' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao buscar os pontos do dia.')
      }
      const data = await response.json()
      setPontos(data)
    } catch (err) {
      setError(err.message || 'Erro desconhecido ao buscar os pontos.')
    }
  }

  // 2) Roda relógio e carrega pontos ao montar
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    setIsLoading(true)
    fetchPontosHoje().finally(() => setIsLoading(false))

    return () => clearInterval(timer)
  }, [])

  const formatTime = date =>
    date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  const formatDate = date => date.toLocaleDateString('pt-BR')

  // 3) Envia timestamp do cliente para o servidor
  const registrarPonto = async () => {
    setIsRegistering(true)
    setError(null)
    setLastRegistration(null)

    // Captura a data/hora EXATA da máquina (sem conversão UTC)
    const agora = new Date()

    const timestampLocal = new Date(agora.getTime() - (agora.getTimezoneOffset() * 60000)).toISOString().slice(0, -1);

    console.log("Data-time Enviado: ", timestampLocal)
    try {
      const response = await fetch('/api/ponto/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: timestampLocal })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Não foi possível registrar o ponto.')
      }

      const novoPontoRaw = await response.json()
      const horaRegistro = new Date(novoPontoRaw.data).toLocaleTimeString(
        'pt-BR',
        { hour: '2-digit', minute: '2-digit', second: '2-digit' }
      )

      setLastRegistration({ hora: horaRegistro })

      // Atualiza lista de pontos do dia
      await fetchPontosHoje()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsRegistering(false)
    }
  }

  // Define o próximo tipo de ponto no front
  const determinarTipoPonto = () => {
    const tipos = ['Entrada 1', 'Saída 1', 'Entrada 2', 'Saída 2']
    return tipos[pontos.length % 4] || 'Entrada'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="ml-4 text-gray-700">Carregando seus registros de hoje...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Ponto</h1>
      </div>

      {/* Erro */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
          role="alert"
        >
          <strong className="font-bold">Erro: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Card Principal */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg text-gray-600">
              Horário Atual:
              <span className="font-bold text-2xl text-gray-900 ml-2">
                {formatTime(currentTime)}
              </span>
            </h2>
            <p className="text-gray-500">{formatDate(currentTime)}</p>
          </div>

          {lastRegistration && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  Ponto registrado com sucesso!
                </span>
              </div>
            </div>
          )}

          <button
            onClick={registrarPonto}
            disabled={isRegistering}
            className="w-full max-w-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-8 rounded-lg transition-colors"
          >
            {isRegistering ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registrando...</span>
              </div>
            ) : (
              'Registrar Ponto'
            )}
          </button>

          <p className="text-sm text-gray-500">
            Próximo registro: {determinarTipoPonto()}
          </p>
        </div>
      </div>

      {/* Pontos do Dia */}
      {pontos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Pontos registrados hoje
          </h3>
          <div className="space-y-3">
            {pontos.map(ponto => (
              <div
                key={ponto.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span className="font-medium text-gray-900">{ponto.tipo}</span>
                </div>
                <span className="text-gray-600 font-mono">{ponto.hora}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
