// src/app/dashboard/colaborador/page.tsx
'use client'
import { useState } from 'react'
import { Clock, Calendar, DollarSign, FileText } from 'lucide-react'
import RegistrarPonto from '../ponto/RegistrarPonto'
import VisualizarPonto from '../ponto/VisualizarPonto'

export default function ColaboradorDashboard() {

const [activeSection, setActiveSection] = useState('dashboard')

  const menuItems = [
    { 
      id: 'envelope', 
      title: 'Envelope de pagamento', 
      icon: FileText, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },

    { 
      id: 'historico', 
      title: 'Histórico Salarial', 
      icon: DollarSign, 
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
  ]

  const renderContent = () => {
    switch(activeSection) {
      case 'registrar-ponto':
        return <RegistrarPonto onBack={() => setActiveSection('dashboard')} />
      case 'visualizar-ponto':
        return <VisualizarPonto onBack={() => setActiveSection('dashboard')} />
      default:
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Olá, 
              </h1>
              <p className="text-gray-600">
                Bem-vindo! Aqui você poderá registrar seus pontos e visualizar seus relatórios.
              </p>
            </div>

            {/* Seção de Ponto */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Controle de Ponto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveSection('registrar-ponto')}
                  className="flex items-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Clock className="w-6 h-6 mr-3" />
                  <span className="font-medium">Registrar Ponto</span>
                </button>
                
                <button
                  onClick={() => setActiveSection('visualizar-ponto')}
                  className="flex items-center p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <Calendar className="w-6 h-6 mr-3" />
                  <span className="font-medium">Visualizar Pontos</span>
                </button>
              </div>
            </div>

            {/* Mais Acessados */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Mais acessados</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {menuItems.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <button
                      key={item.id}
                      className={`p-4 rounded-lg transition-colors ${item.bgColor} group`}
                      onClick={() => console.log(`Navegar para ${item.title}`)}
                    >
                      <div className="text-center space-y-2">
                        <IconComponent className={`w-8 h-8 mx-auto ${item.color}`} />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {item.title}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
}
