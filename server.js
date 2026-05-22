const express = require('express');
const app = express();
app.use(express.json());

const SMOOBU_API_KEY = process.env.SMOOBU_API_KEY || 'A_TUA_API_KEY_AQUI';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'A_TUA_ANTHROPIC_KEY_AQUI';
const PORT = process.env.PORT || 3000;

// Só este apartamento
const APARTMENT_ID = 2957201;

// IDs de mensagens já respondidas
const respondedMessageIds = new Set();

const APARTMENT_SYSTEM_PROMPT = `
És um assistente virtual simpático e profissional do apartamento "Alegria 93", situado na Rua da Alegria, 93, 4.º andar, Porto, Portugal.

O teu objetivo é responder às perguntas dos hóspedes de forma clara, cortês e eficiente. Responde sempre no mesmo idioma em que o hóspede te escreve (inglês, português, espanhol ou francês).

=== INFORMAÇÕES DO APARTAMENTO ===

ATENÇÃO IMPORTANTE — ESCADAS:
O apartamento fica no 4.º andar e NÃO tem elevador. Sempre que o hóspede perguntar sobre acessibilidade, malas pesadas, idosos, bebés, mobilidade reduzida ou elevador, menciona CLARAMENTE que o apartamento fica no 4.º andar sem elevador. Não minimizes esta informação.

CHECK-IN:
- Horário: das 16:00 às 00:00
- Self check-in com cofre de chaves
- As instruções de acesso são enviadas 48 horas antes da chegada
- NÃO envias códigos de acesso — só informas que serão enviados 48h antes

CHECK-OUT:
- Até às 11:00
- Late check-out não é possível garantir (normalmente há hóspedes a entrar a seguir)
- Os hóspedes podem deixar as malas até às 13:00 no dia de check-out

EARLY CHECK-IN E MALAS:
- Early check-in antes das 16:00 não é possível garantir
- Os hóspedes podem deixar as malas a partir das 12:00 no dia de check-in
- Mensagem padrão: "Unfortunately, we cannot guarantee check-in before 16:00, as the apartment needs to be cleaned and prepared after the previous guests. However, you may leave your luggage from 12:00 on the day of check-in."

LUGGIT (serviço de malas):
- Há desconto de 10% para hóspedes com a LUGGit
- Link: https://luggit.app/partner/porto-haven
- O serviço recolhe a bagagem onde o hóspede quiser e entrega no local/hora escolhidos

WI-FI:
- Rede: Vodafone-005A44
- Password: 7u6HCUX9fk

ESTACIONAMENTO:
- Garagem privada nas proximidades: Rua da Alegria, 29
- Preço: 12€ por 24 horas
- Não prometes disponibilidade sem confirmação

LIXO:
- Deve ser deixado à noite
- Ao sair do prédio, fica do lado direito, em frente ao Café Dragão (esquina junto ao semáforo)

REGRAS DA CASA:
- Proibido fumar
- Proibidas festas
- Proibidos animais
- Proibidas visitas de pessoas não incluídas na reserva
- Capacidade máxima: 6 hóspedes

SUPERMERCADOS:
- https://goo.gl/maps/A4yTJWfVJgvqqJrX7
- https://goo.gl/maps/URiy7tfBawLEUmSA7

TRANSPORTES:
- Metro mais próximo: https://goo.gl/maps/o7DmT396yjWpZ3bk8

RECOMENDAÇÕES TURÍSTICAS:
- Estação de São Bento (azulejos), Rua das Flores, Livraria Lello, Palácio da Bolsa, Avenida dos Aliados, Ribeira
- Atravessar a Ponte D. Luís a pé até Gaia (caves de vinho do Porto)
- Torre dos Clérigos
- Foz: caminhar pela Avenida Brasil; Docemar (café com croissants)

RESTAURANTES:
- Comida portuguesa: O Buraco (Rua do Bolhão 95), A Tasquinha (Rua do Carmo 23)
- Francesinha: Cervejaria Brasão ou Café Santiago (ambos na Rua de Passos Manuel)
- Modernos: Cantina 32, Traça, LSD, Terra (Foz), Boa Bao (asiático)

=== REGRAS DE ESCALADA ===
Para os seguintes assuntos, NÃO respondas — diz que vais passar ao anfitrião:
- Pedidos de reembolso, compensação ou desconto
- Cancelamentos
- Queixas de limpeza
- Queixas sobre escadas/elevador se o hóspede estiver zangado
- Falta de acesso ou problema com cofre/chaves
- Perda de chaves
- Hóspedes extra, visitas, festas, animais, fumar
- Barulho/vizinhos, polícia, pragas
- Avarias graves
- Ameaças de má avaliação
- Pedidos de pagamento fora da plataforma

Nestes casos diz: "I'm passing this to our host who will get back to you shortly." (ou no idioma do hóspede)

=== TOM ===
Cortês, simpático e profissional. Respostas concisas e claras.
`;

async function getActiveBookings() {
  const today = new Date().toISOString().split('T')[0];
  const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const response = await fetch(
    `https://login.smoobu.com/api/reservations?apartmentId=${APARTMENT_ID}&arrivalFrom=${past30}&arrivalTo=${future90}&pageSize=50`,
    { headers: { 'Api-Key': SMOOBU_API_KEY, 'Cache-Control': 'no-cache' } }
  );
  return response.json();
}

async function getReservationMessages(reservationId) {
  const response = await fetch(
    `https://login.smoobu.com/api/reservations/${reservationId}/messages`,
    { headers: { 'Api-Key': SMOOBU_API_KEY, 'Cache-Control': 'no-cache' } }
  );
  return response.json();
}

async function sendMessageToGuest(reservationId, messageBody) {
  const response = await fetch(
    `https://login.smoobu.com/api/reservations/${reservationId}/messages/send-message-to-guest`,
    {
      method: 'POST',
      headers: { 'Api-Key': SMOOBU_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageBody }),
    }
  );
  return response.json();
}

async function sendAlertToHost(reservationId, guestMessage) {
  const alertBody = `⚠️ ALERTA IA: Mensagem do hóspede requer a tua atenção:\n\n"${guestMessage}"\n\n— Assistente Alegria 93`;
  const response = await fetch(
    `https://login.smoobu.com/api/reservations/${reservationId}/messages/send-message-to-host`,
    {
      method: 'POST',
      headers: { 'Api-Key': SMOOBU_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageBody: alertBody, internal: true }),
    }
  );
  return response.json();
}

async function generateAIResponse(guestMessage, conversationHistory = []) {
  const messages = [...conversationHistory, { role: 'user', content: guestMessage }];
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: APARTMENT_SYSTEM_PROMPT,
      messages,
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || null;
}

function needsEscalation(aiResponse) {
  const escalationPhrases = [
    "passing this to our host",
    "vou passar ao anfitrião",
    "paso esto al anfitrión",
    "je transmets",
  ];
  return escalationPhrases.some(phrase =>
    aiResponse.toLowerCase().includes(phrase.toLowerCase())
  );
}

async function checkNewMessages() {
  console.log('🔍 A verificar mensagens novas...');
  try {
    const data = await getActiveBookings();
    const bookings = data.bookings || [];
    console.log(`📋 ${bookings.length} reservas encontradas para o Alegria 93`);

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const booking of bookings) {
      try {
        const messagesData = await getReservationMessages(booking.id);
        const messages = messagesData.messages || [];

        // Última mensagem
        const lastMsg = messages[messages.length - 1];

        // Ignora se não há mensagens, se já respondemos, ou se a última é nossa (type 2)
        if (!lastMsg) continue;
        if (lastMsg.type === 2) continue;
        if (respondedMessageIds.has(lastMsg.id)) continue;

        // Só responde a mensagens das últimas 24 horas
        // (o Smoobu não devolve timestamp mas usamos o ID como proxy — IDs mais altos são mais recentes)
        // Marcamos todas as mensagens existentes no arranque como já vistas
        if (!respondedMessageIds.has('initialized_' + booking.id)) {
          console.log(`⏭️ Reserva ${booking.id}: a marcar mensagens existentes como já vistas`);
          messages.forEach(m => respondedMessageIds.add(m.id));
          respondedMessageIds.add('initialized_' + booking.id);
          continue;
        }

        console.log(`💬 Nova mensagem na reserva ${booking.id}: ${lastMsg.message}`);

        // Histórico para contexto
        const history = messages.slice(0, -1).map(m => ({
          role: m.type === 1 ? 'user' : 'assistant',
          content: m.message,
        }));

        const aiResponse = await generateAIResponse(lastMsg.message, history);
        if (!aiResponse) continue;

        console.log(`🤖 Resposta IA: ${aiResponse}`);
        await sendMessageToGuest(booking.id, aiResponse);
        respondedMessageIds.add(lastMsg.id);
        console.log(`✅ Resposta enviada (reserva ${booking.id})`);

        if (needsEscalation(aiResponse)) {
          await sendAlertToHost(booking.id, lastMsg.message);
          console.log(`🚨 Anfitrião alertado`);
        }
      } catch (e) {
        console.warn(`Erro na reserva ${booking.id}:`, e.message);
      }
    }
  } catch (e) {
    console.error('Erro no polling:', e.message);
  }
}

// Polling a cada 60 segundos
setInterval(checkNewMessages, 60 * 1000);
setTimeout(checkNewMessages, 3000);

app.post('/webhook', async (req, res) => {
  res.json({ status: 'received' });
});

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Alegria 93 — AI Guest Assistant',
    apartment: APARTMENT_ID,
    respondedMessages: respondedMessageIds.size,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🏠 Assistente Alegria 93 a correr na porta ${PORT}`);
  console.log(`🔄 Polling ativo — só Alegria 93 (ID: ${APARTMENT_ID})`);
});
