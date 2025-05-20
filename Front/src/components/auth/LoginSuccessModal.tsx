'use client';

import { Check, Edit, Trash2, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import { useEffect, useState } from 'react';

interface LoginSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

export default function LoginSuccessModal({
  isOpen,
  onClose,
  username
}: LoginSuccessModalProps) {
  const [autoClose, setAutoClose] = useState(5);

  // Contador para fechar automaticamente após 5 segundos
  useEffect(() => {
    if (isOpen && autoClose > 0) {
      const timer = setTimeout(() => {
        setAutoClose(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isOpen && autoClose === 0) {
      onClose();
    }
  }, [isOpen, autoClose, onClose]);

  // Resetar o contador quando o modal for aberto novamente
  useEffect(() => {
    if (isOpen) {
      setAutoClose(5);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Login Bem-sucedido"
      size="md"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Bem-vindo{username ? `, ${username}` : ''}!
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Você está autenticado e agora pode criar, editar e excluir conteúdo no site.
        </p>
        
        <div className="grid grid-cols-3 gap-4 w-full mb-6">
          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-2">
              <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Criar</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-2">
              <Edit className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Editar</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Excluir</span>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Entendi ({autoClose}s)
        </button>
      </div>
    </Modal>
  );
}
