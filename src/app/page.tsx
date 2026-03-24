import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const isAuth = cookieStore.get('tesgrup-auth');

  if (isAuth) {
    redirect('/portfolio');
  } else {
    redirect('/login');
  }
}
