# 🏠 Assistente IA — Alegria 93

Assistente automático que responde às mensagens dos hóspedes no Smoobu usando IA (Claude).

## Como funciona

1. Hóspede envia mensagem no Airbnb/Booking/VRBO
2. Smoobu recebe a mensagem e dispara um webhook para este servidor
3. O servidor chama a IA da Anthropic com todas as informações do apartamento
4. A IA gera uma resposta personalizada
5. A resposta é enviada automaticamente ao hóspede via API do Smoobu
6. Se for um assunto sensível (reembolso, reclamação, etc.), o anfitrião é alertado

## Configuração passo a passo

### 1. Obter as API Keys

**Smoobu:**
- Vai a Smoobu > Settings > Developer
- Copia a tua API Key

**Anthropic:**
- Vai a https://console.anthropic.com
- Cria uma API Key (precisas de adicionar créditos — ~$5 dura muito tempo)

### 2. Hospedar o servidor (grátis)

**Opção A — Railway (recomendado):**
1. Vai a https://railway.app e cria conta
2. "New Project" > "Deploy from GitHub" (ou faz upload da pasta)
3. Nas variáveis de ambiente adiciona:
   - `SMOOBU_API_KEY` = a tua key do Smoobu
   - `ANTHROPIC_API_KEY` = a tua key da Anthropic
4. Copia o URL público gerado (ex: `https://alegria93.railway.app`)

**Opção B — Render (também grátis):**
1. Vai a https://render.com
2. "New Web Service" > conecta o repositório
3. Adiciona as variáveis de ambiente
4. Copia o URL público

### 3. Configurar o Webhook no Smoobu

1. Vai a Smoobu > Settings > Developer > Webhooks
2. Adiciona o teu URL: `https://SEU-URL.railway.app/webhook`
3. Seleciona o evento: "New Message" (ou similar)
4. Guarda

### 4. Testar

Envia uma mensagem de teste como hóspede. Deves ver:
- A resposta chegar automaticamente
- Logs no servidor mostrando o processamento

## Assuntos que respondem automaticamente

✅ Check-in / check-out / horários  
✅ Early check-in / late check-out  
✅ Wi-Fi  
✅ Estacionamento  
✅ Como chegar / transportes  
✅ Regras da casa  
✅ Supermercados  
✅ Recomendações turísticas e restaurantes  
✅ Guardar malas (LUGGit)  
✅ Lixo  

## Assuntos escalados para o anfitrião

🚨 Reembolsos, cancelamentos, descontos  
🚨 Reclamações de limpeza  
🚨 Problemas de acesso / chaves perdidas  
🚨 Hóspedes extra, festas, animais  
🚨 Avarias graves  
🚨 Ameaças de má avaliação  

## Idiomas suportados

🇬🇧 Inglês | 🇵🇹 Português | 🇪🇸 Espanhol | 🇫🇷 Francês (e outros)
