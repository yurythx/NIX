from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class SlugBasedViewSetMixin:
    """
    Mixin para ViewSets que utilizam slug como campo de lookup.
    """
    lookup_field = 'slug'

class HistoryMixin:
    """
    Mixin para adicionar uma ação de histórico para visualizar alterações em um objeto.
    """
    @action(detail=True, methods=['get'])
    def history(self, request, *args, **kwargs):
        instance = self.get_object()
        # Implemente lógica para obter histórico de alterações
        # Este é um exemplo simples
        history_data = {
            'id': instance.id,
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
            # Adicionar mais dados de histórico aqui
        }
        return Response(history_data)

class StatusToggleMixin:
    """
    Mixin para alternar estado de objetos (ativo/inativo, arquivado/desarquivado, etc).
    """
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, *args, **kwargs):
        instance = self.get_object()
        
        status_field = getattr(self, 'status_field', 'is_active')
        current_status = getattr(instance, status_field)
        
        # Inverter status atual
        setattr(instance, status_field, not current_status)
        instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class DuplicateMixin:
    """
    Mixin para duplicar objetos.
    """
    @action(detail=True, methods=['post'])
    def duplicate(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Obter classe do modelo e campos
        model_class = instance.__class__
        
        # Campos a serem excluídos na duplicação (geralmente ID, datas, etc)
        exclude_fields = getattr(self, 'duplicate_exclude_fields', ['id', 'created_at', 'updated_at', 'slug'])
        
        # Criar dicionário com valores do objeto original
        data = {}
        for field in model_class._meta.fields:
            if field.name not in exclude_fields:
                data[field.name] = getattr(instance, field.name)
        
        # Prefixo para nome duplicado
        if 'name' in data:
            data['name'] = f"Cópia de {data['name']}"
        
        # Criar novo objeto
        new_instance = model_class.objects.create(**data)
        
        # Serializar e retornar
        serializer = self.get_serializer(new_instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class MultiSerializerViewSetMixin:
    """
    Mixin para ViewSets que precisam de diferentes serializers para diferentes ações.
    """
    serializers = {
        'default': None,
        'list': None,
        'retrieve': None,
        'create': None,
        'update': None,
        'partial_update': None,
    }
    
    def get_serializer_class(self):
        """
        Retorna o serializer apropriado com base na ação atual.
        """
        if not hasattr(self, 'action'):
            return self.serializers.get('default')
            
        return self.serializers.get(self.action, self.serializers.get('default'))