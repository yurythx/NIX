"""
Módulo para localizar e listar jogos de diferentes fontes.

Este módulo fornece funções para encontrar jogos instalados do Steam e em diretórios locais,
além de gerenciar o cache de imagens das capas dos jogos.
"""

import os
import json
import vdf
from typing import List, Dict, Any, Optional
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def url_capa_steam(appid: str) -> str:
    """
    Gera a URL da capa de um jogo da Steam com base no AppID.
    
    Args:
        appid: ID único do jogo na Steam
        
    Returns:
        URL da imagem da capa do jogo
    """
    return f"http://media.steampowered.com/steamcommunity/public/images/apps/{appid}/header.jpg"

def listar_steam_jogos() -> List[Dict[str, Any]]:
    """
    Lista todos os jogos da Steam instalados no computador.
    
    Returns:
        Lista de dicionários contendo informações dos jogos da Steam
    """
    jogos = []
    steam_path = os.path.expandvars(r"%ProgramFiles(x86)%\Steam\steamapps")
    library_file = os.path.join(steam_path, "libraryfolders.vdf")
    
    if not os.path.exists(steam_path) or not os.path.exists(library_file):
        logger.warning("Diretório do Steam não encontrado")
        return jogos
    
    try:
        with open(library_file, 'r', encoding='utf-8') as f:
            data = vdf.load(f)
            
        steamapps_paths = []
        try:
            for pasta in data['libraryfolders'].values():
                caminho = pasta['path'] if isinstance(pasta, dict) else pasta
                steamapps_path = os.path.join(caminho, "steamapps")
                if os.path.exists(steamapps_path):
                    steamapps_paths.append(steamapps_path)
                else:
                    logger.warning(f"Diretório SteamApps não encontrado: {steamapps_path}")
        except (KeyError, AttributeError) as e:
            logger.error(f"Erro ao processar libraryfolders.vdf: {e}")
            return jogos
        
        for steamapps in steamapps_paths:
            try:
                if not os.path.exists(steamapps):
                    continue
                    
                for arquivo in os.listdir(steamapps):
                    if not arquivo.endswith(".acf"):
                        continue
                        
                    try:
                        with open(os.path.join(steamapps, arquivo), 'r', encoding='utf-8') as f:
                            acf = vdf.load(f)
                            
                        if 'AppState' not in acf:
                            continue
                            
                        appid = acf['AppState'].get('appid')
                        nome = acf['AppState'].get('name')
                        
                        if not appid or not nome:
                            continue
                            
                        capa = url_capa_steam(appid)
                        jogos.append({
                            "nome": nome,
                            "executavel": None,  # Será preenchido pelo Steam
                            "fonte": "Steam",
                            "appid": appid,
                            "capa": capa,
                            "descricao": f"Jogo Steam: {nome} (AppID: {appid})",
                            "ultima_execucao": acf['AppState'].get('LastPlayed', 0)
                        })
                        
                    except (vdf.VDFError, KeyError, json.JSONDecodeError) as e:
                        logger.error(f"Erro ao processar arquivo ACF {arquivo}: {e}")
                        continue
                        
            except OSError as e:
                logger.error(f"Erro ao acessar diretório {steamapps}: {e}")
                continue
                
    except Exception as e:
        logger.critical(f"Erro inesperado ao listar jogos Steam: {e}", exc_info=True)
    
    logger.info(f"Encontrados {len(jogos)} jogos da Steam")
    return jogos

def listar_jogos_hd(diretorios: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """
    Lista jogos a partir de diretórios locais.
    
    Args:
        diretorios: Lista de diretórios para buscar jogos. Se None, usa as pastas do config.json
        
    Returns:
        Lista de dicionários contendo informações dos jogos encontrados
    """
    if diretorios is None:
        try:
            with open("config.json", 'r', encoding='utf-8') as f:
                config = json.load(f)
                diretorios = config.get("pastas_hd", [])
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.error(f"Erro ao carregar config.json: {e}")
            diretorios = []
    
    if not diretorios:
        logger.warning("Nenhum diretório de jogos configurado")
        return []
    
    jogos = []
    diretorios_nao_encontrados = []
    
    for base in diretorios:
        if not os.path.exists(base):
            diretorios_nao_encontrados.append(base)
            continue
            
        logger.info(f"Buscando jogos em: {base}")
        
        try:
            for root, _, files in os.walk(base):
                for f in files:
                    if not (f.lower().endswith(".exe") and 
                           not f.startswith("unins") and 
                           "setup" not in f.lower() and 
                           "install" not in f.lower() and
                           "update" not in f.lower()):
                        continue
                        
                    try:
                        path = os.path.join(root, f)
                        nome = os.path.splitext(f)[0]
                        
                        # Pular executáveis do Windows e do sistema
                        if any(part.lower() in path.lower() for part in ["windows", "system32", "winsxs"]):
                            continue
                            
                        # Tenta encontrar uma imagem na mesma pasta
                        capa = None
                        for img_ext in ['.jpg', '.jpeg', '.png', '.bmp']:
                            img_path = os.path.join(root, nome + img_ext)
                            if os.path.exists(img_path):
                                capa = img_path
                                break
                        
                        jogos.append({
                            "nome": nome,
                            "executavel": path,
                            "fonte": "HD Local",
                            "caminho": root,
                            "capa": capa,
                            "descricao": f"Arquivo: {f}",
                            "ultima_execucao": int(os.path.getmtime(path)) if os.path.exists(path) else 0
                        })
                        
                    except OSError as e:
                        logger.warning(f"Erro ao processar arquivo {f}: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Erro ao varrer diretório {base}: {e}")
            continue
    
    if diretorios_nao_encontrados:
        logger.warning(f"Diretórios não encontrados: {', '.join(diretorios_nao_encontrados)}")
    
    logger.info(f"Encontrados {len(jogos)} jogos em disco local")
    return jogos

def listar_todos_os_jogos() -> List[Dict[str, Any]]:
    """
    Lista todos os jogos disponíveis, tanto da Steam quanto de diretórios locais.
    
    Returns:
        Lista de dicionários contendo informações de todos os jogos encontrados,
        ordenados por nome.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    jogos = []
    
    # Executa as buscas em paralelo
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {
            executor.submit(listar_steam_jogos): "steam",
            executor.submit(listar_jogos_hd): "hd"
        }
        
        for future in as_completed(futures):
            try:
                resultado = future.result()
                if resultado:
                    jogos.extend(resultado)
            except Exception as e:
                logger.error(f"Erro ao buscar jogos ({futures[future]}): {e}")
    
    # Remove duplicatas (pode acontecer se um jogo estiver em mais de uma fonte)
    jogos_unicos = {}
    for jogo in jogos:
        chave = (jogo['nome'].lower(), jogo.get('appid'))
        if chave not in jogos_unicos:
            jogos_unicos[chave] = jogo
    
    # Ordena por nome
    resultado = sorted(jogos_unicos.values(), key=lambda x: x['nome'].lower())
    
    logger.info(f"Total de jogos encontrados: {len(resultado)}")
    return resultado
