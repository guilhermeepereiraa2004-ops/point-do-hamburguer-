import './admin-design.css';
import { getAdminIdentity } from '@/actions/admin';
import { redirect } from 'next/navigation';
import AdminPanel from './panel';
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
 const identity = await getAdminIdentity();
 if (!identity) redirect('/sign-in');
 if (identity.mustChangePassword) redirect('/admin/seguranca');
 return <AdminPanel/>;
}
