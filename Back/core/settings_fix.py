"""
Script para corrigir as sequências de escape nos caminhos do Windows no settings.py
"""

import os
import re

def fix_settings():
    """
    Corrige as sequências de escape nos caminhos do Windows no settings.py
    """
    # Caminho para o arquivo settings.py
    settings_path = 'back/core/settings.py'
    
    # Ler o conteúdo do arquivo
    with open(settings_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Corrigir as linhas problemáticas
    # Usamos expressões regulares para encontrar e substituir os padrões
    
    # Padrão 1: PROGRAMFILES
    pattern1 = r'os\.path\.join\(os\.environ\.get\("PROGRAMFILES", "C:\\\\?Program Files"\), "poppler", "bin"\),'
    replacement1 = r'os.path.join(os.environ.get("PROGRAMFILES", r"C:\\Program Files"), "poppler", "bin"),'
    content = re.sub(pattern1, replacement1, content)
    
    # Padrão 2: PROGRAMFILES(X86)
    pattern2 = r'os\.path\.join\(os\.environ\.get\("PROGRAMFILES\(X86\)", "C:\\\\?Program Files \(x86\)"\), "poppler", "bin"\),'
    replacement2 = r'os.path.join(os.environ.get("PROGRAMFILES(X86)", r"C:\\Program Files (x86)"), "poppler", "bin"),'
    content = re.sub(pattern2, replacement2, content)
    
    # Padrão 3: LOCALAPPDATA
    pattern3 = r'os\.path\.join\(os\.environ\.get\("LOCALAPPDATA", "C:\\\\?Users\\\\" \+ os\.getlogin\(\) \+ "\\\\?AppData\\\\?Local"\), "poppler", "bin"\),'
    replacement3 = r'os.path.join(os.environ.get("LOCALAPPDATA", os.path.join(r"C:\\Users", os.getlogin(), r"AppData\\Local")), "poppler", "bin"),'
    content = re.sub(pattern3, replacement3, content)
    
    # Escrever o conteúdo corrigido de volta no arquivo
    with open(settings_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Arquivo {settings_path} corrigido com sucesso!")

if __name__ == "__main__":
    fix_settings()
