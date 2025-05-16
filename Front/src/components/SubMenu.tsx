'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useSidebar } from './SidebarProvider';

interface SubMenuProps {
  title: string;
  icon: React.ReactNode;
  items: {
    label: string;
    href: string;
  }[];
}

export default function SubMenu({ title, icon, items }: SubMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, toggleSidebar } = useSidebar();

  useEffect(() => {
    if (isCollapsed && isOpen) {
      setIsOpen(false);
    }
  }, [isCollapsed, isOpen]);

  const handleClick = () => {
    if (isCollapsed) {
      toggleSidebar();
      // Pequeno delay para garantir que a sidebar expandiu antes de abrir o submenu
      setTimeout(() => {
        setIsOpen(true);
      }, 300);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-indigo-500 dark:text-indigo-400">
            {icon}
          </span>
          {!isCollapsed && (
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {title}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-12 space-y-2">
              {items.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className="block py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 