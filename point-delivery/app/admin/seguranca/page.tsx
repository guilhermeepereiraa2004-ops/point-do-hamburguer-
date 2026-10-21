import '@/app/admin/admin-design.css';
import { getAdminIdentity } from '@/actions/admin';
import { redirect } from 'next/navigation';
import { AdminPassword } from '@/components/admin-password';
export const dynamic='force-dynamic';
export default async function SecurityPage(){
  const identity=await getAdminIdentity();
  if(!identity)redirect('/sign-in');
  return <AdminPassword requiredChange={identity.mustChangePassword}/>;
}
