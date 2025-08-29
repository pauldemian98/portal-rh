import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface UserJwtPayload {
  sub: number;
  role: string;
}

// Função auxiliar para verificar o token no servidor
async function getUserData() {
  const tokenCookie = (await cookies()).get('auth_token');
  if (!tokenCookie) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify<UserJwtPayload>(tokenCookie.value, secret);

    const user = await db.colaborador.findUnique({
      where: { id: payload.sub },
      select: { nome: true, tipo: true }, // Selecionamos apenas os dados necessários
    });
    
    if (!user) return null;

    return user;
  } catch (error) {
    console.log("Error do Layout: ", error)
    // Token inválido ou expirado
    return null;
  }
}


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserData();

  // Se por algum motivo o usuário não for encontrado (token inválido),
  // o middleware já deveria ter redirecionado, mas esta é uma segurança extra.
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl text-indigo-600">
                Sistema de Ponto
              </span>
            </div>
            <div className="flex items-center space-x-4">
               <div className='text-right'>
                 <p className="text-sm font-medium text-gray-800">{user.nome}</p>
                 <p className="text-xs text-gray-500">Cargo: {user.tipo}</p>
               </div>
               <Link 
                 href="/api/auth/logout" 
                 className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                 prefetch={false} // Desabilita o pré-carregamento para a rota de logout
               >
                 Sair
               </Link>
            </div>
          </div>
        </nav>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
