import os
import sys
import django
import json
import traceback

# Configurar o ambiente Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Importar modelos e serializadores após configurar o ambiente
from django.contrib.auth import get_user_model
from apps.accounts.serializers import UserSerializer

User = get_user_model()

def test_user_list():
    """
    Testa a listagem de usuários
    """
    try:
        # Obter todos os usuários
        users = User.objects.all().order_by('-created_at')
        
        # Serializar os usuários
        serializer = UserSerializer(users, many=True)
        
        # Imprimir os dados serializados
        print("Usuários encontrados:", len(serializer.data))
        print("Dados serializados:", json.dumps(serializer.data[:2], indent=2))
        
        return True
    except Exception as e:
        print("Erro ao listar usuários:", str(e))
        traceback.print_exc()
        return False

def test_user_detail():
    """
    Testa a obtenção de detalhes de um usuário
    """
    try:
        # Obter o primeiro usuário
        user = User.objects.first()
        
        if not user:
            print("Nenhum usuário encontrado")
            return False
        
        # Serializar o usuário
        serializer = UserSerializer(user)
        
        # Imprimir os dados serializados
        print("Dados do usuário:", json.dumps(serializer.data, indent=2))
        
        return True
    except Exception as e:
        print("Erro ao obter detalhes do usuário:", str(e))
        traceback.print_exc()
        return False

def main():
    """
    Função principal
    """
    print("Testando API de usuários...")
    
    # Testar listagem de usuários
    print("\n1. Testando listagem de usuários...")
    if test_user_list():
        print("✅ Teste de listagem de usuários concluído com sucesso")
    else:
        print("❌ Teste de listagem de usuários falhou")
    
    # Testar detalhes de usuário
    print("\n2. Testando detalhes de usuário...")
    if test_user_detail():
        print("✅ Teste de detalhes de usuário concluído com sucesso")
    else:
        print("❌ Teste de detalhes de usuário falhou")

if __name__ == "__main__":
    main()
