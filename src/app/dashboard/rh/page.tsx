// src/app/dashboard/rh/page.tsx
import Link from 'next/link';

export default function RhDashboard() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-xl font-semibold text-gray-800">
        Dashboard de Recursos Humanos
      </h1>
      <p className="mt-2 text-gray-600">
        Bem-vindo! Gerencie os colaboradores e visualize os relatórios gerais.
      </p>
      
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-700">Ações Rápidas</h2>
        <div className="mt-2">
            {/* O ideal seria ter uma página /dashboard/rh/registrar para isso */}
            <Link href="#" className="text-indigo-600 hover:text-indigo-800">
                + Registrar Novo Colaborador
            </Link>
        </div>
      </div>
    </div>
  );
}
