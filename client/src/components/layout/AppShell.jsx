import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-paper text-ink relative">
      <Navbar />
      
      <main className="pt-28 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
