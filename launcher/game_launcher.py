"""
Módulo responsável por iniciar jogos de diferentes fontes e plataformas.

Este módulo fornece funções para lançar jogos da Steam e executáveis locais,
com suporte a diferentes sistemas operacionais e tratamento de erros robusto.
"""

import os
import sys
import subprocess
import platform
import logging
import json
from typing import Optional, Dict, Any, Union, List
from pathlib import Path

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Caminhos para clientes de jogos
STEAM_EXECUTABLES = {
    'windows': [
        r"C:\Program Files (x86)\Steam\Steam.exe",
        r"C:\Program Files\Steam\Steam.exe"
    ],
    'linux': [
        os.path.expanduser("~/.steam/steam/steam.sh"),
        "/usr/bin/steam"
    ],
    'darwin': [
        "/Applications/Steam.app/Contents/MacOS/steam_osx"
    ]
}

class LauncherError(Exception):
    """Exceção base para erros no lançamento de jogos."""
    pass

class SteamLauncherError(LauncherError):
    """Exceção para erros específicos do cliente Steam."""
    pass

def encontrar_steam() -> Optional[str]:
    """
    Tenta encontrar o caminho do executável do Steam no sistema.
    
    Returns:
        Caminho para o executável do Steam ou None se não encontrado.
    """
    system = platform.system().lower()
    
    if 'windows' in system:
        system = 'windows'
    elif 'linux' in system:
        system = 'linux'
    elif 'darwin' in system:
        system = 'darwin'
    else:
        logger.warning(f"Sistema operacional não suportado: {system}")
        return None
    
    for path in STEAM_EXECUTABLES.get(system, []):
        if os.path.exists(path):
            logger.info(f"Steam encontrado em: {path}")
            return path
    
    logger.warning("Nenhum cliente Steam encontrado no sistema")
    return None

def iniciar_jogo_steam(app_id: Union[str, int]) -> bool:
    """
    Inicia um jogo da Steam usando o app_id.
    
    Args:
        app_id: ID do jogo na Steam
        
    Returns:
        True se o jogo foi iniciado com sucesso, False caso contrário
    """
    steam_path = encontrar_steam()
    if not steam_path:
        logger.error("Não foi possível encontrar o cliente Steam")
        return False
    
    try:
        app_id = str(app_id)
        if not app_id.isdigit():
            logger.error(f"ID do jogo inválido: {app_id}")
            return False
            
        logger.info(f"Iniciando jogo Steam com AppID: {app_id}")
        
        # Comando para iniciar o jogo via Steam
        if platform.system() == 'Windows':
            # No Windows, usamos o protocolo steam://
            import webbrowser
            webbrowser.open(f"steam://run/{app_id}")
        else:
            # Em outros sistemas, usamos o cliente de linha de comando
            subprocess.Popen([steam_path, f"steam://run/{app_id}"])
            
        logger.info(f"Jogo Steam {app_id} iniciado com sucesso")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao iniciar jogo Steam {app_id}: {e}", exc_info=True)
        return False

def executar_comando_seguro(comando: Union[str, List[str]], cwd: Optional[str] = None) -> bool:
    """
    Executa um comando de forma segura com tratamento de erros.
    
    Args:
        comando: Comando a ser executado (string ou lista de argumentos)
        cwd: Diretório de trabalho
        
    Returns:
        True se o comando foi executado com sucesso, False caso contrário
    """
    try:
        logger.info(f"Executando comando: {comando}")
        
        if isinstance(comando, str):
            # Usar shell=True apenas para strings no Windows
            shell = platform.system() == 'Windows'
            process = subprocess.Popen(
                comando,
                shell=shell,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
        else:
            # Para listas, não usar shell=True por questões de segurança
            process = subprocess.Popen(
                comando,
                shell=False,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            
        # Aguarda o processo terminar (com timeout de 10 segundos para verificar se deu erro)
        try:
            stdout, stderr = process.communicate(timeout=10)
            
            if process.returncode != 0:
                logger.error(f"Erro ao executar comando. Código de saída: {process.returncode}")
                if stdout:
                    logger.error(f"Saída: {stdout.strip()}")
                if stderr:
                    logger.error(f"Erro: {stderr.strip()}")
                return False
                
            if stdout:
                logger.debug(f"Saída: {stdout.strip()}")
                
            return True
            
        except subprocess.TimeoutExpired:
            # Se o processo ainda estiver rodando após o timeout, consideramos sucesso
            logger.info("Processo iniciado com sucesso (ainda em execução)")
            return True
            
    except Exception as e:
        logger.error(f"Erro ao executar comando: {e}", exc_info=True)
        return False

def iniciar_jogo(jogo_info: Dict[str, Any]) -> bool:
    """
    Inicia um jogo com base nas informações fornecidas.
    
    Args:
        jogo_info: Dicionário com informações do jogo
        
    Returns:
        True se o jogo foi iniciado com sucesso, False caso contrário
    """
    if not jogo_info:
        logger.error("Nenhuma informação de jogo fornecida")
        return False
        
    nome = jogo_info.get('nome', 'Desconhecido')
    logger.info(f"Iniciando jogo: {nome}")
    
    try:
        # Se for um jogo da Steam
        if jogo_info.get('fonte') == 'Steam' and 'appid' in jogo_info:
            return iniciar_jogo_steam(jogo_info['appid'])
            
        # Se for um executável local
        executavel = jogo_info.get('executavel')
        if not executavel:
            logger.error("Nenhum executável especificado para o jogo")
            return False
            
        # Verifica se o arquivo existe
        if not os.path.exists(executavel):
            logger.error(f"Arquivo não encontrado: {executavel}")
            return False
            
        # Obtém o diretório de trabalho (diretório do executável)
        diretorio = os.path.dirname(executavel)
        
        # Configura o comando para executar
        if platform.system() == 'Windows':
            # No Windows, usamos o startfile para abrir o executável
            try:
                os.startfile(executavel)
                logger.info(f"Jogo iniciado: {executavel}")
                return True
            except OSError as e:
                logger.error(f"Erro ao iniciar o jogo: {e}")
                return False
        else:
            # Em outros sistemas, usamos subprocess
            try:
                # Torna o arquivo executável se necessário
                if not os.access(executavel, os.X_OK):
                    os.chmod(executavel, 0o755)
                
                # Executa o jogo
                process = subprocess.Popen(
                    [executavel],
                    cwd=diretorio,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                
                # Verifica se o processo iniciou corretamente
                if process.poll() is None:
                    logger.info(f"Jogo iniciado com sucesso: {executavel}")
                    return True
                else:
                    stdout, stderr = process.communicate()
                    logger.error(f"Falha ao iniciar o jogo. Erro: {stderr.decode('utf-8', errors='ignore')}")
                    return False
                    
            except Exception as e:
                logger.error(f"Erro ao iniciar o jogo: {e}", exc_info=True)
                return False
                
    except Exception as e:
        logger.critical(f"Erro inesperado ao iniciar o jogo: {e}", exc_info=True)
        return False
