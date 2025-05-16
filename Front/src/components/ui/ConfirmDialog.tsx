'use client';

import React, { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  icon?: ReactNode;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  icon,
  variant = 'warning'
}) => {
  // Definir cores com base na variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
          confirmBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800',
          confirmText: 'text-white'
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800',
          confirmText: 'text-white'
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          confirmBg: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800',
          confirmText: 'text-white'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${styles.iconBg} p-2 rounded-full`}>
                    {icon || <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} aria-hidden="true" />}
                  </div>
                  <div className="ml-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent ${styles.confirmBg} px-4 py-2 text-sm font-medium ${styles.confirmText} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400`}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    {confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ConfirmDialog;
