'use client';

import React, { useState, useEffect } from 'react';
import { Settings, MessageSquare, Shield, Bell, User, Lock, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSettings } from '../../contexts/SettingsContext';
import PageTitle from '../../components/ui/PageTitle';
import { Card } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Switch } from '../../components/ui/Switch';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';

export default function ConfiguracoesPage() {
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const { settings, isLoading, isSaving, updateSettings, resetSettings } = useSettings();
  const router = useRouter();

  // Estado para o diálogo de confirmação
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Verificar se o usuário está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Salvar configurações de comentários
  const saveCommentSettings = async () => {
    try {
      await updateSettings({
        comments: {
          ...settings.comments
        }
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de comentários:', error);
    }
  };

  // Salvar configurações de segurança
  const saveSecuritySettings = async () => {
    try {
      await updateSettings({
        security: {
          ...settings.security
        }
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de segurança:', error);
    }
  };

  // Salvar configurações de notificações
  const saveNotificationSettings = async () => {
    try {
      await updateSettings({
        notifications: {
          ...settings.notifications
        }
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de notificações:', error);
    }
  };

  // Salvar configurações de conta
  const saveAccountSettings = async () => {
    try {
      await updateSettings({
        account: {
          ...settings.account
        }
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de conta:', error);
    }
  };

  // Redefinir todas as configurações
  const handleResetSettings = async () => {
    try {
      await resetSettings();
    } catch (error) {
      console.error('Erro ao redefinir configurações:', error);
    }
  };

  // Verificar se o usuário é administrador
  const isAdmin = user && user.is_staff;

  if (!isAuthenticated) {
    return null; // Redirecionando para login
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle
        title="Configurações"
        icon={<Settings className="w-8 h-8" />}
        description="Gerencie as configurações do sistema"
      />

      <Tabs defaultValue="comentarios" className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="comentarios">
            <MessageSquare className="w-4 h-4 mr-2" />
            Comentários
          </TabsTrigger>
          <TabsTrigger value="seguranca">
            <Shield className="w-4 h-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="notificacoes">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="conta">
            <User className="w-4 h-4 mr-2" />
            Conta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comentarios">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-indigo-500" />
                  Configurações de Comentários
                </h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResetDialogOpen(true)}
                    className="flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Redefinir
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveCommentSettings}
                    disabled={isSaving || isLoading}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {isAdmin && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Aprovação de Comentários</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Exigir aprovação manual para novos comentários antes de serem publicados
                      </p>
                    </div>
                    <Switch
                      checked={settings.comments.requireCommentApproval}
                      onCheckedChange={(checked) =>
                        updateSettings({
                          comments: {
                            ...settings.comments,
                            requireCommentApproval: checked
                          }
                        })
                      }
                      disabled={isSaving || isLoading}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Comentários Anônimos</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Permitir que visitantes não logados possam comentar
                    </p>
                  </div>
                  <Switch
                    checked={settings.comments.allowAnonymousComments}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        comments: {
                          ...settings.comments,
                          allowAnonymousComments: checked
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Notificações de Comentários</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receber notificações quando novos comentários forem adicionados
                    </p>
                  </div>
                  <Switch
                    checked={settings.comments.notifyOnNewComments}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        comments: {
                          ...settings.comments,
                          notifyOnNewComments: checked
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  />
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                  <p className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                    Estas configurações afetam como os comentários são exibidos e gerenciados em todo o site.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-indigo-500" />
                  Configurações de Segurança
                </h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResetDialogOpen(true)}
                    className="flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Redefinir
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveSecuritySettings}
                    disabled={isSaving || isLoading}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Autenticação de Dois Fatores</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Adiciona uma camada extra de segurança à sua conta
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        security: {
                          ...settings.security,
                          twoFactorEnabled: checked
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Notificações de Login</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receber notificações quando houver um novo login na sua conta
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.loginNotifications}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        security: {
                          ...settings.security,
                          loginNotifications: checked
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="font-medium">Tempo Limite da Sessão</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tempo em minutos até que sua sessão expire por inatividade
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="5"
                      max="1440"
                      value={settings.security.sessionTimeout}
                      onChange={(e) =>
                        updateSettings({
                          security: {
                            ...settings.security,
                            sessionTimeout: parseInt(e.target.value) || 60
                          }
                        })
                      }
                      disabled={isSaving || isLoading}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">minutos</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                  <p className="flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-green-500" />
                    Mantenha suas configurações de segurança atualizadas para proteger sua conta.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-indigo-500" />
                  Configurações de Notificações
                </h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResetDialogOpen(true)}
                    className="flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Redefinir
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveNotificationSettings}
                    disabled={isSaving || isLoading}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Notificações por E-mail</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receber notificações por e-mail
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          emailNotifications: checked
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Notificações Push</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receber notificações push no navegador
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          pushNotifications: checked
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Novos Artigos</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receber notificações quando novos artigos forem publicados
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.notifyOnNewArticles}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          notifyOnNewArticles: checked
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Respostas a Comentários</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receber notificações quando alguém responder aos seus comentários
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.notifyOnReplies}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          notifyOnReplies: checked
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="font-medium">Frequência do Resumo</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Com que frequência você deseja receber um resumo das atividades
                    </p>
                  </div>
                  <Select
                    value={settings.notifications.digestFrequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'never') =>
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          digestFrequency: value
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="never">Nunca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                  <p className="flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-blue-500" />
                    Personalize suas notificações para se manter informado sobre o que importa para você.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="conta">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <User className="w-5 h-5 mr-2 text-indigo-500" />
                  Configurações de Conta
                </h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResetDialogOpen(true)}
                    className="flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Redefinir
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveAccountSettings}
                    disabled={isSaving || isLoading}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome de Exibição</Label>
                  <Input
                    id="displayName"
                    value={settings.account.displayName}
                    onChange={(e) =>
                      updateSettings({
                        account: {
                          ...settings.account,
                          displayName: e.target.value
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                    placeholder={user ? `${user.first_name} ${user.last_name}` : 'Seu nome'}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Este nome será exibido publicamente em seus comentários e contribuições
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <textarea
                    id="bio"
                    rows={3}
                    value={settings.account.bio}
                    onChange={(e) =>
                      updateSettings({
                        account: {
                          ...settings.account,
                          bio: e.target.value
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                    placeholder="Uma breve descrição sobre você"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Uma breve descrição sobre você que será exibida em seu perfil público
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Mostrar E-mail</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Permitir que outros usuários vejam seu endereço de e-mail
                    </p>
                  </div>
                  <Switch
                    checked={settings.account.showEmail}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        account: {
                          ...settings.account,
                          showEmail: checked
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="font-medium">Idioma</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Idioma preferido para a interface do usuário
                    </p>
                  </div>
                  <Select
                    value={settings.account.language}
                    onValueChange={(value) =>
                      updateSettings({
                        account: {
                          ...settings.account,
                          language: value
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="font-medium">Tema</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Escolha o tema da interface do usuário
                    </p>
                  </div>
                  <Select
                    value={settings.account.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') =>
                      updateSettings({
                        account: {
                          ...settings.account,
                          theme: value
                        }
                      })
                    }
                    disabled={isSaving || isLoading}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                  <p className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-purple-500" />
                    Personalize sua experiência no site ajustando suas configurações de conta.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação para redefinir configurações */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetSettings}
        title="Redefinir configurações"
        description="Tem certeza que deseja redefinir todas as configurações para os valores padrão? Esta ação não pode ser desfeita."
        confirmText="Sim, redefinir"
        cancelText="Cancelar"
        variant="danger"
        icon={<RefreshCw className="h-6 w-6" />}
      />
    </div>
  );
}
