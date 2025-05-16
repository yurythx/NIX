from django.db import migrations, models
import django.utils.timezone

class Migration(migrations.Migration):

    dependencies = [
        ('articles', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True, verbose_name='Email'),
        ),
        migrations.AddField(
            model_name='comment',
            name='is_approved',
            field=models.BooleanField(default=True, verbose_name='Aprovado'),
        ),
        migrations.AddField(
            model_name='comment',
            name='is_spam',
            field=models.BooleanField(default=False, verbose_name='Marcado como spam'),
        ),
        migrations.AddField(
            model_name='comment',
            name='ip_address',
            field=models.GenericIPAddressField(blank=True, null=True, verbose_name='Endereço IP'),
        ),
        migrations.AddField(
            model_name='comment',
            name='user_agent',
            field=models.TextField(blank=True, null=True, verbose_name='User Agent'),
        ),
        migrations.AddField(
            model_name='comment',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, verbose_name='Atualizado em'),
        ),
        migrations.AlterField(
            model_name='comment',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now, verbose_name='Criado em'),
        ),
        migrations.AlterField(
            model_name='comment',
            name='name',
            field=models.CharField(max_length=100, verbose_name='Nome'),
        ),
        migrations.AlterField(
            model_name='comment',
            name='text',
            field=models.TextField(verbose_name='Texto'),
        ),
    ]
