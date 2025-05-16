"""
Serviço para carregamento assíncrono de arquivos grandes
"""

import os
import threading
import queue
import logging
import time
import hashlib
from django.core.cache import cache

# Configurar logging
logger = logging.getLogger(__name__)

class AsyncLoader:
    """
    Classe para carregamento assíncrono de arquivos grandes
    """
    
    def __init__(self, max_workers=5, cache_timeout=3600):
        """
        Inicializa o carregador assíncrono
        
        Args:
            max_workers (int): Número máximo de workers
            cache_timeout (int): Tempo de expiração do cache em segundos
        """
        self.max_workers = max_workers
        self.cache_timeout = cache_timeout
        self.task_queue = queue.Queue()
        self.workers = []
        self.running = False
        self.results = {}
        self.callbacks = {}
        
        # Iniciar os workers
        self.start_workers()
    
    def start_workers(self):
        """
        Inicia os workers
        """
        if self.running:
            return
        
        self.running = True
        
        for i in range(self.max_workers):
            worker = threading.Thread(target=self._worker_loop, daemon=True)
            worker.start()
            self.workers.append(worker)
    
    def stop_workers(self):
        """
        Para os workers
        """
        self.running = False
        
        # Adicionar tarefas de finalização para cada worker
        for _ in range(self.max_workers):
            self.task_queue.put(None)
        
        # Aguardar a finalização dos workers
        for worker in self.workers:
            worker.join()
        
        self.workers = []
    
    def _worker_loop(self):
        """
        Loop principal do worker
        """
        while self.running:
            try:
                # Obter uma tarefa da fila
                task = self.task_queue.get(timeout=1)
                
                # Se a tarefa for None, finalizar o worker
                if task is None:
                    break
                
                # Executar a tarefa
                task_id, func, args, kwargs = task
                
                try:
                    # Executar a função
                    result = func(*args, **kwargs)
                    
                    # Armazenar o resultado
                    self.results[task_id] = result
                    
                    # Chamar o callback, se existir
                    if task_id in self.callbacks:
                        callback = self.callbacks[task_id]
                        callback(result)
                        del self.callbacks[task_id]
                except Exception as e:
                    logger.error(f"Erro ao executar tarefa {task_id}: {str(e)}")
                    self.results[task_id] = None
                
                # Marcar a tarefa como concluída
                self.task_queue.task_done()
            except queue.Empty:
                # Fila vazia, continuar
                pass
            except Exception as e:
                logger.error(f"Erro no worker: {str(e)}")
    
    def add_task(self, func, args=None, kwargs=None, callback=None):
        """
        Adiciona uma tarefa à fila
        
        Args:
            func (callable): Função a ser executada
            args (tuple): Argumentos posicionais
            kwargs (dict): Argumentos nomeados
            callback (callable): Função a ser chamada quando a tarefa for concluída
            
        Returns:
            str: ID da tarefa
        """
        if args is None:
            args = ()
        
        if kwargs is None:
            kwargs = {}
        
        # Gerar um ID para a tarefa
        task_id = hashlib.md5(f"{func.__name__}_{args}_{kwargs}_{time.time()}".encode()).hexdigest()
        
        # Armazenar o callback
        if callback:
            self.callbacks[task_id] = callback
        
        # Adicionar a tarefa à fila
        self.task_queue.put((task_id, func, args, kwargs))
        
        return task_id
    
    def get_result(self, task_id, wait=False, timeout=None):
        """
        Obtém o resultado de uma tarefa
        
        Args:
            task_id (str): ID da tarefa
            wait (bool): Se True, aguarda a conclusão da tarefa
            timeout (float): Tempo máximo de espera em segundos
            
        Returns:
            object: Resultado da tarefa
        """
        if wait:
            # Aguardar a conclusão da tarefa
            start_time = time.time()
            
            while task_id not in self.results:
                # Verificar o timeout
                if timeout and time.time() - start_time > timeout:
                    return None
                
                # Aguardar um pouco
                time.sleep(0.1)
        
        # Retornar o resultado
        return self.results.get(task_id)
    
    def clear_result(self, task_id):
        """
        Remove o resultado de uma tarefa
        
        Args:
            task_id (str): ID da tarefa
        """
        if task_id in self.results:
            del self.results[task_id]
    
    def clear_all_results(self):
        """
        Remove todos os resultados
        """
        self.results.clear()
    
    def wait_all(self, timeout=None):
        """
        Aguarda a conclusão de todas as tarefas
        
        Args:
            timeout (float): Tempo máximo de espera em segundos
            
        Returns:
            bool: True se todas as tarefas foram concluídas, False caso contrário
        """
        try:
            self.task_queue.join(timeout=timeout)
            return True
        except queue.Empty:
            return False

# Instância singleton do carregador assíncrono
async_loader = AsyncLoader()
