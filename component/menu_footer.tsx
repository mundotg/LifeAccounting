// components/Navbar.tsx
"use client";
import { useState } from 'react';
import Link from 'next/link';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const navLinks = [
    { name: 'Dashboard', href: '/#' },
    { name: 'Transações', href: '/#' },
    { name: 'Budget', href: '/#' },
    { name: 'Reports', href: '/#' },
  ];

  const userDropdownLinks = [
    { name: 'Perfil', href: '/#' },
    { name: 'Configuração', href: '/#' },
    { name: 'Sair', href: '/#' },
  ];

  return (
    <nav className="bg-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">LifeAccounting</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 hover:text-white"
              >
                {link.name}
              </Link>
            ))}
            
            {/* User dropdown */}
            <div className="relative ml-3">
              <div>
                <button
                  onClick={() => toggleDropdown('user')}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 focus:outline-none"
                >
                  <span>minha conta</span>
                  <svg
                    className={`h-4 w-4 transition-transform ${activeDropdown === 'user' ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              {activeDropdown === 'user' && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    {userDropdownLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-slate-700 focus:outline-none"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">{isMobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-slate-700">
            <div className="px-2 space-y-1">
              {userDropdownLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700 hover:text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};



// components/Footer.jsx
const Footer = () => {
  return (
    <footer className="bg-slate-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">FinanControl</h3>
            <p className="text-sm text-gray-300">
              Sistema de contabilidade financeira para gerenciamento 
              completo de suas finanças pessoais e empresariais.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/#" className="hover:text-white">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/#" className="hover:text-white">
                  Fluxo de Caixa
                </Link>
              </li>
              <li>
                <Link href="/#" className="hover:text-white">
                  Análise de Resultado
                </Link>
              </li>
              <li>
                <Link href="/#" className="hover:text-white">
                  Balanço Financeiro
                </Link>
              </li>
              <li>
                <Link href="/#" className="hover:text-white">
                  Balancete
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>suporte@financontrol.com</li>
              <li>(11) 9999-9999</li>
              <li>
                <Link href="/suporte" className="hover:text-white">
                  Central de Suporte
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-300">&copy; {new Date().getFullYear()} FinanControl. Todos os direitos reservados. by francemy</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link href="/privacidade" className="text-sm text-gray-300 hover:text-white">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="text-sm text-gray-300 hover:text-white">
              Termos de Uso
            </Link>
            </div>
            </div>
            </div>
            </footer>
            );
            };
// components/ModalVisualizar.jsx   
export {Navbar,Footer};