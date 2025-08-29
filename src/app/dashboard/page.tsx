import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify, JWTPayload } from 'jose';

// Definindo a interface do payload fora da função para maior clareza
interface UserJwtPayload extends JWTPayload {
  id: string;
  role: 'RH' | 'COLABORADOR';
}

export default async function DashboardRootPage() {
  const tokenCookie = (await cookies()).get('auth_token');

  if (!tokenCookie) {
    redirect('/login');
  }

  let payload: UserJwtPayload;

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('A variável de ambiente JWT_SECRET não foi definida.');
    }

    // A função jwtVerify espera um Uint8Array como chave, 
    // que é exatamente o que new TextEncoder().encode() produz.
    // Este código está correto para as versões modernas da biblioteca 'jose'.
    const secretKey = new TextEncoder().encode(secret);
    
    // O 'try' tem a responsabilidade única de verificar o token.
    const { payload: verifiedPayload } = await jwtVerify<UserJwtPayload>(tokenCookie.value, secretKey);
    payload = verifiedPayload;

  } catch (error) {
    // Este 'catch' agora só será ativado por um erro real na validação do JWT.
    console.error('Falha na verificação do token, redirecionando para login:', error);
    redirect('/login');
  }

  // Se o código chegou aqui, o token é válido.
  // Agora a lógica de redirecionamento pode ocorrer sem a interferência do 'catch'.
  if (payload.role === 'RH') {
    redirect('/dashboard/rh');
  } else {
    redirect('/dashboard/colaborador');
  }

  // Este trecho nunca será alcançado devido aos redirecionamentos acima.
  return null;
}
