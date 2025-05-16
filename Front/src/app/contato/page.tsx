'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const ContatoPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: ''
  });
  
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    
    // Simulação de envio
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
      setFormData({
        nome: '',
        email: '',
        assunto: '',
        mensagem: ''
      });
      
      // Reset do estado de enviado após 5 segundos
      setTimeout(() => {
        setEnviado(false);
      }, 5000);
    }, 1500);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Cabeçalho */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
          Entre em Contato
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Estamos aqui para ouvir suas dúvidas, sugestões e comentários
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Informações de Contato */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Informações de Contato</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="bg-purple-100 dark:bg-purple-900 w-10 h-10 rounded-full flex items-center justify-center">
                    <Mail className="text-purple-600 dark:text-purple-300" size={20} />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Email</h3>
                  <p className="text-gray-600 dark:text-gray-300">contato@projetoprometheus.com</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="bg-indigo-100 dark:bg-indigo-900 w-10 h-10 rounded-full flex items-center justify-center">
                    <Phone className="text-indigo-600 dark:text-indigo-300" size={20} />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Telefone</h3>
                  <p className="text-gray-600 dark:text-gray-300">(11) 99999-9999</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="bg-blue-100 dark:bg-blue-900 w-10 h-10 rounded-full flex items-center justify-center">
                    <MapPin className="text-blue-600 dark:text-blue-300" size={20} />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Endereço</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Av. Paulista, 1000<br />
                    São Paulo, SP - Brasil
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Horário de Atendimento</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Segunda a Sexta: 9h às 18h<br />
                Sábado: 9h às 13h<br />
                Domingo: Fechado
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Formulário de Contato */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Envie uma Mensagem</h2>
            
            {enviado ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-100 dark:bg-green-900 p-6 rounded-lg text-center"
              >
                <h3 className="text-xl font-medium text-green-800 dark:text-green-200 mb-2">Mensagem Enviada!</h3>
                <p className="text-green-700 dark:text-green-300">
                  Obrigado por entrar em contato. Responderemos em breve!
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assunto
                  </label>
                  <select
                    id="assunto"
                    name="assunto"
                    value={formData.assunto}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="Dúvida">Dúvida</option>
                    <option value="Sugestão">Sugestão</option>
                    <option value="Parceria">Parceria</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mensagem
                  </label>
                  <textarea
                    id="mensagem"
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  ></textarea>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-md shadow-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                  >
                    {enviando ? (
                      <>Enviando...</>
                    ) : (
                      <>
                        Enviar Mensagem <Send className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContatoPage;
