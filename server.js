const express = require('express');
const app = express();
app.use(express.json());

const SMOOBU_API_KEY = process.env.SMOOBU_API_KEY || 'A_TUA_API_KEY_AQUI';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'A_TUA_ANTHROPIC_KEY_AQUI';
const PORT = process.env.PORT || 3000;
const APARTMENT_ID = 2957201;
const lastSeenMessageId = {};

const APARTMENT_SYSTEM_PROMPT = `
És um assistente virtual simpático e profissional do apartamento "Alegria 93", situado na Rua da Alegria, 93, 4.º andar, Porto, Portugal.
Responde sempre no mesmo idioma em que o hóspede te escreve (inglês, português, espanhol ou francês).

ATENÇÃO — ESCADAS: O apartamento fica no 4.º andar SEM elevador. Menciona sempre claramente quando perguntarem sobre acessibilidade, malas pesadas, mobilidade reduzida ou elevador.

CHECK-IN: 16:00–00:00. Self check-in com cofre. Instruções enviadas 48h antes. NÃO envias códigos.
CHECK-OUT: até às 11:00. Late check-out não garantido. Malas até às 13:00.
EARLY CHECK-IN: não garantido. Malas a partir das 12:00.
LUGGIT: desconto 10% — https://luggit.app/partner/porto-haven
WI-FI: Rede Vodafone-005A44 / Password 7u6HCUX9fk
ESTACIONAMENTO: Rua da Alegria 29 — €12/24h
LIXO: à noite, lado direito à saída, frente ao Café Dragão (esquina semáforo)
REGRAS: proibido fumar, festas, animais, visitas externas. Máx 6 hóspedes.

ESCALADA para anfitrião: reembolsos, cancelamentos, reclamações, problemas de acesso, chaves, avarias, má avaliação, pagamento fora plataforma.
Nestes casos: "I'm passing this to our host who will get back to you shortly."

Tom: cortês, simpático, profissional.`;

const GUIDE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Alegria 93 — Guest Guide</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0;color:#1a1a1a;min-height:100vh}
.hero{background:#1a1a1a;color:#fff;padding:2rem 1.25rem 1.5rem;position:relative}
.hero-tag{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:6px}
.hero-title{font-size:26px;font-weight:600;margin-bottom:4px}
.hero-sub{font-size:14px;color:#aaa;margin-bottom:1.25rem}
.lang-toggle{display:flex;gap:8px}
.lang-btn{padding:6px 16px;border-radius:20px;border:1px solid #444;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s}
.lang-btn.active{background:#fff;color:#1a1a1a;border-color:#fff}
.hero-map{display:inline-flex;align-items:center;gap:6px;margin-top:1rem;color:#ccc;font-size:13px;text-decoration:none;border-bottom:1px solid #444;padding-bottom:2px}
.container{max-width:600px;margin:0 auto;padding:1rem}
.section{background:#fff;border-radius:12px;margin-bottom:0.75rem;overflow:hidden;border:1px solid #ece9e3}
.section-header{display:flex;align-items:center;gap:10px;padding:1rem 1.25rem;cursor:pointer;user-select:none}
.section-icon{width:32px;height:32px;border-radius:8px;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-title{font-size:15px;font-weight:600;flex:1;color:#1a1a1a}
.section-chevron{font-size:18px;color:#999;transition:transform 0.25s}
.section-body{padding:0 1.25rem 1.25rem;display:none}
.section-body.open{display:block}
.section-header.open .section-chevron{transform:rotate(180deg)}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0.75rem}
.info-card{background:#f7f5f0;border-radius:8px;padding:0.75rem}
.info-card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.info-card-value{font-size:15px;font-weight:600;color:#1a1a1a}
.wifi-box{background:#1a1a1a;color:#fff;border-radius:10px;padding:1rem 1.25rem;margin-bottom:0.75rem}
.wifi-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.wifi-value{font-size:16px;font-weight:600;font-family:monospace;letter-spacing:0.05em}
.notice{background:#fff8e6;border:1px solid #f0d080;border-radius:8px;padding:0.75rem 1rem;margin-top:0.75rem;display:flex;gap:8px;align-items:flex-start}
.notice span{font-size:16px;flex-shrink:0;margin-top:1px}
.notice p{font-size:13px;color:#7a5c00;line-height:1.5}
.place{padding:10px 0;border-bottom:1px solid #f0ede8}
.place:last-child{border-bottom:none}
.place-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}
.place-name{font-size:14px;font-weight:600;color:#1a1a1a}
.place-rating{font-size:12px;color:#f59e0b;font-weight:600;white-space:nowrap}
.place-desc{font-size:12px;color:#666;line-height:1.4;margin-bottom:5px}
.place-meta{font-size:11px;color:#999;margin-bottom:5px}
.map-link{font-size:12px;color:#2563eb;text-decoration:none;display:inline-flex;align-items:center;gap:3px}
.map-link:hover{text-decoration:underline}
.badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:10px;margin-left:5px;font-weight:500}
.badge-cash{background:#fef3c7;color:#92400e}
.badge-reserve{background:#ede9fe;color:#5b21b6}
.rule{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0ede8;font-size:14px}
.rule:last-child{border-bottom:none}
.rule-icon{font-size:16px;width:24px;text-align:center}
.tip{font-size:13px;color:#555;line-height:1.5;padding:8px 0}
.service-item{padding:10px 0;border-bottom:1px solid #f0ede8}
.service-item:last-child{border-bottom:none}
.service-name{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
.service-desc{font-size:12px;color:#666;margin-bottom:5px}
.divider{height:1px;background:#f0ede8;margin:10px 0}
.footer{text-align:center;padding:2rem 1rem;color:#999;font-size:12px}
.emergency-box{background:#fff1f1;border:1px solid #fecaca;border-radius:10px;padding:1rem 1.25rem}
.emergency-title{font-size:13px;font-weight:600;color:#991b1b;margin-bottom:8px}
.emergency-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #fecaca}
.emergency-row:last-child{border-bottom:none}
.emergency-label{color:#666}
.emergency-num{font-weight:600;color:#1a1a1a}
</style>
</head>
<body>

<div class="hero">
  <div class="hero-tag">Porto Haven</div>
  <div class="hero-title">Alegria 93</div>
  <div class="hero-sub">Rua da Alegria, 93 · 4º andar · Porto</div>
  <div class="lang-toggle">
    <button class="lang-btn active" onclick="setLang('en')">English</button>
    <button class="lang-btn" onclick="setLang('pt')">Português</button>
    <button class="lang-btn" onclick="setLang('es')">Español</button>
    <button class="lang-btn" onclick="setLang('fr')">Français</button>
  </div>
  <a href="https://maps.app.goo.gl/XvB8rcyHfxnWQKBa8" target="_blank" class="hero-map">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
</div>

<div class="container">

  <!-- CHECK-IN -->
  <div class="section">
    <div class="section-header open" onclick="toggle(this)">
      <div class="section-icon">🔑</div>
      <div class="section-title" data-en="Check-in & check-out" data-pt="Check-in & check-out" data-es="Check-in & check-out" data-fr="Check-in & check-out">Check-in & check-out</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body open">
      <div class="info-grid">
        <div class="info-card"><div class="info-card-label" data-en="Check-in" data-pt="Check-in" data-es="Check-in" data-fr="Check-in">Check-in</div><div class="info-card-value">16:00 – 00:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Check-out" data-pt="Check-out" data-es="Check-out" data-fr="Check-out">Check-out</div><div class="info-card-value" data-en="by 11:00" data-pt="até às 11:00" data-es="antes de las 11:00" data-fr="avant 11h00">by 11:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (arrival)" data-pt="Deixar malas (chegada)" data-es="Dejar maletas (llegada)" data-fr="Déposer bagages (arrivée)">Drop bags (arrival)</div><div class="info-card-value" data-en="from 12:00" data-pt="a partir das 12:00" data-es="desde las 12:00" data-fr="à partir de 12h00">from 12:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (departure)" data-pt="Deixar malas (saída)" data-es="Dejar maletas (salida)" data-fr="Déposer bagages (départ)">Drop bags (departure)</div><div class="info-card-value" data-en="until 13:00" data-pt="até às 13:00" data-es="hasta las 13:00" data-fr="jusqu'à 13h00">until 13:00</div></div>
      </div>
      <p class="tip" data-en="Self check-in with key box. Your access code is sent 48 hours before arrival. Insert the code and pull. Inside you'll find 2 keys: one for the building door and one for the apartment on the 4th floor." data-pt="Self check-in com cofre. O código de acesso é enviado 48h antes. Insere o código e puxa. Encontras 2 chaves: uma para a porta do prédio e outra para o apartamento no 4º andar." data-es="Self check-in con caja de llaves. Tu código de acceso se envía 48 horas antes de la llegada. Inserta el código y tira. Encontrarás 2 llaves: una para la puerta del edificio y otra para el apartamento en el 4º piso." data-fr="Self check-in avec boîte à clés. Votre code d'accès est envoyé 48 heures avant l'arrivée. Insérez le code et tirez. Vous trouverez 2 clés : une pour la porte de l'immeuble et une pour l'appartement au 4e étage.">Self check-in with key box. Your access code is sent 48 hours before arrival. Insert the code and pull. Inside you'll find 2 keys: one for the building door and one for the apartment on the 4th floor.</p>
      <div class="notice"><span>⚠️</span><p data-en="The apartment is on the 4th floor with no lift. There are stairs to climb with your luggage." data-pt="O apartamento fica no 4.º andar sem elevador. Terás de subir escadas com a bagagem." data-es="El apartamento está en el 4º piso sin ascensor. Tendrás que subir escaleras con el equipaje." data-fr="L'appartement est au 4e étage sans ascenseur. Vous devrez monter les escaliers avec vos bagages.">The apartment is on the 4th floor with no lift. There are stairs to climb with your luggage.</p></div>
    </div>
  </div>

  <!-- WI-FI -->
  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📶</div>
      <div class="section-title">Wi-Fi</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="wifi-box">
        <div class="wifi-label" data-en="Network" data-pt="Rede" data-es="Red" data-fr="Réseau">Network</div>
        <div class="wifi-value">Vodafone-005A44</div>
      </div>
      <div class="wifi-box" style="margin-top:8px">
        <div class="wifi-label">Password</div>
        <div class="wifi-value">7u6HCUX9fk</div>
      </div>
    </div>
  </div>

  <!-- RESTAURANTS -->
  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🍽️</div>
      <div class="section-title" data-en="Restaurants & cafés" data-pt="Restaurantes & cafés" data-es="Restaurantes & cafés" data-fr="Restaurants & cafés">Restaurants & cafés</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-header"><div class="place-name">Maria Rita <span class="badge badge-cash" data-en="cash only" data-pt="só dinheiro">cash only</span><span class="badge badge-reserve" data-en="book ahead" data-pt="reserva obrigatória">book ahead</span></div><div class="place-rating">⭐ local fav</div></div>
        <div class="place-desc" data-en="Legendary octopus, generous portions and genuine warmth. A neighbourhood gem." data-pt="Polvo lendário, doses generosas e acolhimento genuíno. Uma pérola do bairro.">Legendary octopus, generous portions and genuine warmth. A neighbourhood gem.</div>
        <div class="place-meta" data-en="Mon–Sun 12:00–15:00 & 19:30–00:00" data-pt="Seg–Dom 12h–15h e 19h30–00h">Mon–Sun 12:00–15:00 & 19:30–00:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJoxs8c-9kJA0R9K7AdZ3yyrw" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Francesinha Café <span class="badge badge-reserve" data-en="book ahead" data-pt="reserva">book ahead</span></div><div class="place-rating">⭐ top francesinha</div></div>
        <div class="place-desc" data-en="One of Porto's best francesinhas, right on your street. Small and always busy." data-pt="Uma das melhores francesinhas do Porto, mesmo na tua rua. Pequeno e sempre cheio.">One of Porto's best francesinhas, right on your street. Small and always busy.</div>
        <div class="place-meta" data-en="Tue–Sat 12:30–15:00 & 19:00–22:00" data-pt="Ter–Sáb 12h30–15h e 19h–22h">Tue–Sat 12:30–15:00 & 19:00–22:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJtZ4woVhkJA0R1YIaQGr591Y" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Estrela do Lima</div><div class="place-rating">⭐ neighbourhood gem</div></div>
        <div class="place-desc" data-en="Family restaurant, incredibly welcoming and consistently excellent." data-pt="Restaurante de família, acolhedor e consistentemente excelente.">Family restaurant, incredibly welcoming and consistently excellent.</div>
        <div class="place-meta" data-en="Mon–Sat 12:00–15:00 & 19:00–22:00" data-pt="Seg–Sáb 12h–15h e 19h–22h">Mon–Sat 12:00–15:00 & 19:00–22:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJY0yxo1hkJA0Rzh1qc1HiG-E" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Solar da Alegria</div><div class="place-rating">⭐ traditional</div></div>
        <div class="place-desc" data-en="Steaks and fresh fish in a cosy traditional setting, right on your street." data-pt="Bifes e peixe fresco num ambiente tradicional, mesmo na tua rua.">Steaks and fresh fish in a cosy traditional setting, right on your street.</div>
        <div class="place-meta" data-en="Mon–Sat 12:00–15:00 & 18:30–22:00" data-pt="Seg–Sáb 12h–15h e 18h30–22h">Mon–Sat 12:00–15:00 & 18:30–22:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJp2jXV_ZkJA0RJRCdIFc8ea8" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Portucale</div><div class="place-rating">⭐ panoramic views</div></div>
        <div class="place-desc" data-en="Stunning panoramic views from the 13th floor. A classic Porto dining experience." data-pt="Vistas panorâmicas deslumbrantes do 13.º andar. Uma experiência gastronómica clássica.">Stunning panoramic views from the 13th floor. A classic Porto dining experience.</div>
        <div class="place-meta" data-en="Daily 12:30–15:00 & 19:30–23:00" data-pt="Diário 12h30–15h e 19h30–23h">Daily 12:30–15:00 & 19:30–23:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJrW4kIPdkJA0RtoVTs5RG6QU" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Cafés & brunch" data-pt="Cafés & brunch" data-es="Cafés & brunch" data-fr="Cafés & brunch">Cafés & brunch</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Breakfast Lovers Bolhão</div><div class="place-rating">⭐ next door</div></div>
        <div class="place-desc" data-en="Right next door at nº 87! Exceptional brunch and impeccable presentation." data-pt="Mesmo ao lado, no nº87! Brunch excecional e apresentação impecável.">Right next door at nº 87! Exceptional brunch and impeccable presentation.</div>
        <div class="place-meta" data-en="Daily 8:00–16:00" data-pt="Diário 8h–16h">Daily 8:00–16:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ3XkGDKFlJA0Rj904CCpHG-o" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Café D. Fernando</div><div class="place-rating">⭐ local classic</div></div>
        <div class="place-desc" data-en="Old-fashioned Portuguese café with honest food and one of the friendliest owners you'll meet." data-pt="Café português à antiga, comida honesta e um dos donos mais simpáticos que vais encontrar.">Old-fashioned Portuguese café with honest food and one of the friendliest owners you'll meet.</div>
        <div class="place-meta" data-en="Mon–Fri 8:00–18:00" data-pt="Seg–Sex 8h–18h">Mon–Fri 8:00–18:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJJ_vMcfBkJA0ROajNsAC7q5I" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Rooftop bars" data-pt="Rooftop bars" data-es="Bares en azotea" data-fr="Bars en terrasse">Rooftop bars</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Terraço do Jardim</div><div class="place-rating">⭐ 4.4 · 128 reviews</div></div>
        <div class="place-desc" data-en="Rooftop lounge with stunning city views, great cocktails and friendly staff. A hidden gem." data-pt="Rooftop com vistas deslumbrantes da cidade, cocktails e equipa simpática. Uma joia escondida.">Rooftop lounge with stunning city views, great cocktails and friendly staff. A hidden gem.</div>
        <div class="place-meta" data-en="Daily 11:00–00:00" data-pt="Diário 11h–00h">Daily 11:00–00:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJh1ZsQQBlJA0RNY_5IS7Ix58" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Amura Bar & Rooftop</div><div class="place-rating">⭐ 4.5 · river views</div></div>
        <div class="place-desc" data-en="Beautiful rooftop overlooking the Douro river. Great atmosphere, friendly service." data-pt="Rooftop com vistas para o Douro. Excelente ambiente e serviço simpático.">Beautiful rooftop overlooking the Douro river. Great atmosphere, friendly service.</div>
        <div class="place-meta" data-en="Daily 11:00–23:30" data-pt="Diário 11h–23h30">Daily 11:00–23:30</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ31kEd4FlJA0R6My2TrmhC6o" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <!-- SUPERMARKETS -->
  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🛒</div>
      <div class="section-title" data-en="Supermarkets" data-pt="Supermercados" data-es="Supermercados" data-fr="Supermarchés">Supermarkets</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Ali Supermarket</div>
        <div class="place-desc" data-en="Right on your street at nº 139. Open until 4am every day — perfect for late arrivals." data-pt="Mesmo na tua rua, no nº139. Aberto até às 4h da manhã todos os dias.">Right on your street at nº 139. Open until 4am every day — perfect for late arrivals.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJwWHrbdllJA0RvcrYoNNTTDw" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name">Alaina Supermarket</div>
        <div class="place-desc" data-en="Rua da Alegria 278. Good selection, open until late. Daily 11:30–02:00." data-pt="Rua da Alegria 278. Boa seleção, aberto até tarde. Diário 11h30–2h.">Rua da Alegria 278. Good selection, open until late. Daily 11:30–02:00.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ7RiMh8RlJA0RXB2lGK_yfaw" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <!-- TRANSPORT -->
  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🚇</div>
      <div class="section-title" data-en="Getting around" data-pt="Transportes" data-es="Cómo moverse" data-fr="Se déplacer">Getting around</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name" data-en="Metro — Bolhão (Yellow Line)" data-pt="Metro — Bolhão (Linha Amarela)" data-es="Metro — Bolhão (Línea Amarilla)" data-fr="Métro — Bolhão (Ligne Jaune)">Metro — Bolhão (Yellow Line)</div>
        <div class="service-desc" data-en="~5 min walk. Connects to the airport, city centre and all main hubs." data-pt="~5 min a pé. Liga ao aeroporto, centro e todos os principais nós da cidade.">~5 min walk. Connects to the airport, city centre and all main hubs.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJXUpOsvpkJA0RUdn_HxFcuu0" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Bus stop — Bolhão" data-pt="Paragem de autocarro — Bolhão" data-es="Parada de autobús — Bolhão" data-fr="Arrêt de bus — Bolhão">Bus stop — Bolhão</div>
        <div class="service-desc" data-en="Multiple bus lines nearby. Main stop at Rua de Fernandes Tomás / Bolhão." data-pt="Várias linhas de autocarro perto. Paragem principal na Rua de Fernandes Tomás / Bolhão.">Multiple bus lines nearby. Main stop at Rua de Fernandes Tomás / Bolhão.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJezow-_pkJA0RizuzbjfTz4M" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Taxi rank — Trindade" data-pt="Praça de Taxis — Trindade" data-es="Parada de taxis — Trindade" data-fr="Station de taxis — Trindade">Taxi rank — Trindade</div>
        <div class="service-desc" data-en="Open 24h. Rua da Trindade, ~5 min walk. Also available: Uber, Bolt, Free Now." data-pt="Aberto 24h. Rua da Trindade, ~5 min a pé. Também disponível: Uber, Bolt, Free Now.">Open 24h. Rua da Trindade, ~5 min walk. Also available: Uber, Bolt, Free Now.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJdQVvcftkJA0RaHWksbiwQSI" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Airport transfer" data-pt="Transfer aeroporto" data-es="Traslado al aeropuerto" data-fr="Transfert aéroport">Airport transfer</div>
        <div class="service-desc" data-en="Book a direct ride to/from the apartment." data-pt="Reserva uma viagem direta de/para o apartamento.">Book a direct ride to/from the apartment.</div>
        <a href="https://bnb.welcomepickups.com/property_groups/311/properties/4635" target="_blank" class="map-link">🚗 <span data-en="Book transfer" data-pt="Reservar transfer" data-es="Reservar traslado" data-fr="Réserver un transfert">Book transfer</span></a>
      </div>
    </div>
  </div>

  <!-- PARKING -->
  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🅿️</div>
      <div class="section-title" data-en="Parking" data-pt="Estacionamento" data-es="Aparcamiento" data-fr="Stationnement">Parking</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name" data-en="Private garage — Rua da Alegria 29" data-pt="Garagem privada — Rua da Alegria 29" data-es="Garaje privado — Rua da Alegria 29" data-fr="Garage privé — Rua da Alegria 29">Private garage — Rua da Alegria 29</div>
        <div class="place-desc" data-en="Steps from the apartment. €12/24h. Very convenient." data-pt="A poucos passos do apartamento. €12/24h. Muito conveniente.">Steps from the apartment. €12/24h. Very convenient.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Parque Central — Rua da Alegria 35" data-pt="Parque Central — Rua da Alegria 35" data-es="Parque Central — Rua da Alegria 35" data-fr="Parque Central — Rua da Alegria 35">Parque Central — Rua da Alegria 35</div>
        <div class="place-desc" data-en="€1.40/h · max €12/day · Open 24h self-service · Don't leave valuables in the car." data-pt="€1,40/h · máx €12/dia · Aberto 24h self-service · Não deixes objetos de valor no carro.">€1.40/h · max €12/day · Open 24h self-service · Don't leave valuables in the car.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJx_IeIABlJA0RuSpXIa9DFR0" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <!-- USEFUL SERVICES -->
  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🏪</div>
      <div class="section-title" data-en="Useful services nearby" data-pt="Serviços úteis perto" data-es="Servicios útiles cerca" data-fr="Services utiles à proximité">Useful services nearby</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Pharmacy" data-pt="Farmácia" data-es="Farmacia" data-fr="Pharmacie">Pharmacy</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Farmácia Garantia</div><div class="place-rating">⭐ 4.6</div></div>
        <div class="place-desc" data-en="Friendly and professional staff, great prices. Highly recommended." data-pt="Equipa simpática e profissional, bons preços. Muito recomendada.">Friendly and professional staff, great prices. Highly recommended.</div>
        <div class="place-meta" data-en="Mon–Fri 8:30–19:30 · Sat 9:00–19:00" data-pt="Seg–Sex 8h30–19h30 · Sáb 9h–19h">Mon–Fri 8:30–19:30 · Sat 9:00–19:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJazRAz_pkJA0RgEqEF1fSzJE" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Hair salon" data-pt="Cabeleireiro" data-es="Peluquería" data-fr="Salon de coiffure">Hair salon</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Gomes CorteseCores</div><div class="place-rating">⭐ 4.9 · 1080 reviews</div></div>
        <div class="place-desc" data-en="Outstanding salon right on your street. Speaks English, takes WhatsApp bookings. Consistently excellent reviews." data-pt="Salão excelente mesmo na tua rua. Fala inglês, marcações via WhatsApp. Reviews consistentemente excelentes.">Outstanding salon right on your street. Speaks English, takes WhatsApp bookings. Consistently excellent reviews.</div>
        <div class="place-meta" data-en="Mon–Fri 9:30–20:00 · Sat 9:30–19:00" data-pt="Seg–Sex 9h30–20h · Sáb 9h30–19h">Mon–Fri 9:30–20:00 · Sat 9:30–19:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJTxgfNvBkJA0RbgitoHmwvpc" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Laundry" data-pt="Lavandaria" data-es="Lavandería" data-fr="Laverie">Laundry</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Lavandaria Marlinwash</div><div class="place-rating">⭐ 4.5 · 218 reviews</div></div>
        <div class="place-desc" data-en="Self-service laundry on your street at nº 166. Detergent included. English instructions. Open daily 8:00–21:30." data-pt="Lavandaria self-service na tua rua, no nº 166. Detergente incluído. Instruções em inglês. Aberta todos os dias 8h–21h30.">Self-service laundry on your street at nº 166. Detergent included. English instructions. Open daily 8:00–21:30.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJRwFy5u9kJA0RHOntiM57qTs" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="ATM / Cash" data-pt="Multibanco" data-es="Cajero / Efectivo" data-fr="Distributeur / Espèces">ATM / Cash</p>
      <div class="place">
        <div class="place-name" data-en="Multibanco — Rua da Alegria 3" data-pt="Multibanco — Rua da Alegria 3" data-es="Cajero — Rua da Alegria 3" data-fr="Distributeur — Rua da Alegria 3">Multibanco — Rua da Alegria 3</div>
        <div class="place-desc" data-en="Closest ATM, just steps away at the bottom of your street. Use Multibanco machines — avoid Euronet (high fees)." data-pt="O multibanco mais próximo, mesmo no início da tua rua. Usa máquinas Multibanco — evita Euronet (taxas altas).">Closest ATM, just steps away at the bottom of your street. Use Multibanco machines — avoid Euronet (high fees).</div>
      </div>
    </div>
  </div>

  <!-- LUGGAGE -->
  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🧳</div>
      <div class="section-title" data-en="Luggage storage" data-pt="Guarda-bagagem" data-es="Consigna de equipaje" data-fr="Consigne à bagages">Luggage storage</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name">Bounce</div>
        <div class="service-desc" data-en="Storage locations nearby from €1/day. 5% discount with our link." data-pt="Locais de armazenamento perto, a partir de €1/dia. 5% de desconto com o nosso link.">Storage locations nearby from €1/day. 5% discount with our link.</div>
        <a href="https://go.bounce.com/PORTOHAVEN7471817336" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
      <div class="service-item">
        <div class="service-name">LUGGit</div>
        <div class="service-desc" data-en="Collects and delivers your bags wherever and whenever you want. 10% discount for our guests." data-pt="Recolhe e entrega a tua bagagem onde e quando quiseres. 10% de desconto para os nossos hóspedes.">Collects and delivers your bags wherever and whenever you want. 10% discount for our guests.</div>
        <a href="https://luggit.app/partner/porto-haven" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
    </div>
  </div>

  <!-- SIGHTSEEING -->
  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🗺️</div>
      <div class="section-title" data-en="Things to do" data-pt="O que visitar" data-es="Qué hacer" data-fr="À faire">Things to do</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name" data-en="São Bento Station" data-pt="Estação de São Bento" data-es="Estación de São Bento" data-fr="Gare de São Bento">São Bento Station</div>
        <div class="place-desc" data-en="Stunning azulejo tile panels depicting Portuguese history. Free to enter." data-pt="Painéis de azulejos impressionantes com cenas da história portuguesa. Entrada gratuita.">Stunning azulejo tile panels depicting Portuguese history. Free to enter.</div>
      </div>
      <div class="place">
        <div class="place-name">Livraria Lello</div>
        <div class="place-desc" data-en="One of the most beautiful bookshops in the world. Book tickets online to avoid queues." data-pt="Uma das livrarias mais bonitas do mundo. Compra bilhetes online para evitar filas.">One of the most beautiful bookshops in the world. Book tickets online to avoid queues.</div>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Palácio da Bolsa</div><div class="place-rating">⭐ 4.5 · 13k reviews</div></div>
        <div class="place-desc" data-en="Magnificent 19th century palace. The Arab Room is breathtaking. Guided tours only (~30 min)." data-pt="Palácio magnífico do séc. XIX. A Sala Árabe é de cortar a respiração. Só visitas guiadas (~30 min).">Magnificent 19th century palace. The Arab Room is breathtaking. Guided tours only (~30 min).</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJQQ2CwuFkJA0RUdkM5HFBMmk" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name" data-en="Ribeira & D. Luís Bridge" data-pt="Ribeira & Ponte D. Luís" data-es="Ribeira & Puente D. Luís" data-fr="Ribeira & Pont D. Luís">Ribeira & D. Luís Bridge</div>
        <div class="place-desc" data-en="Walk along the riverside, cross the bridge on foot to Gaia for the Port wine cellars and stunning views." data-pt="Passeio junto ao rio, atravessa a ponte a pé até Gaia para as caves de vinho do Porto e vistas deslumbrantes.">Walk along the riverside, cross the bridge on foot to Gaia for the Port wine cellars and stunning views.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Torre dos Clérigos" data-pt="Torre dos Clérigos" data-es="Torre dos Clérigos" data-fr="Tour dos Clérigos">Torre dos Clérigos</div>
        <div class="place-desc" data-en="Iconic baroque tower with a 360° panoramic view of Porto. Well worth the climb." data-pt="Torre barroca icónica com vista panorâmica 360° do Porto. Vale bem a subida.">Iconic baroque tower with a 360° panoramic view of Porto. Well worth the climb.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Foz do Douro" data-pt="Foz do Douro" data-es="Foz do Douro" data-fr="Foz do Douro">Foz do Douro</div>
        <div class="place-desc" data-en="Where the Douro meets the Atlantic. Walk along Avenida Brasil. Stop at Docemar for exceptional croissants." data-pt="Onde o Douro encontra o Atlântico. Passeio pela Avenida Brasil. Para no Docemar para provar os croissants.">Where the Douro meets the Atlantic. Walk along Avenida Brasil. Stop at Docemar for exceptional croissants.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Rua das Flores & Avenida dos Aliados" data-pt="Rua das Flores & Avenida dos Aliados" data-es="Rua das Flores & Avenida dos Aliados" data-fr="Rua das Flores & Avenida dos Aliados">Rua das Flores & Avenida dos Aliados</div>
        <div class="place-desc" data-en="Beautiful pedestrian street and the grand boulevard at the heart of Porto." data-pt="Bela rua pedonal e a grande avenida no coração do Porto.">Beautiful pedestrian street and the grand boulevard at the heart of Porto.</div>
      </div>
    </div>
  </div>

  <!-- HOUSE RULES -->
  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📋</div>
      <div class="section-title" data-en="House rules" data-pt="Regras da casa" data-es="Normas de la casa" data-fr="Règles de la maison">House rules</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="rule"><div class="rule-icon">🚭</div><span data-en="No smoking" data-pt="Proibido fumar" data-es="Prohibido fumar" data-fr="Défense de fumer">No smoking</span></div>
      <div class="rule"><div class="rule-icon">🎉</div><span data-en="No parties or events" data-pt="Sem festas ou eventos" data-es="Sin fiestas ni eventos" data-fr="Pas de fêtes ni d'événements">No parties or events</span></div>
      <div class="rule"><div class="rule-icon">🐾</div><span data-en="No pets" data-pt="Sem animais" data-es="No se admiten mascotas" data-fr="Animaux interdits">No pets</span></div>
      <div class="rule"><div class="rule-icon">🚫</div><span data-en="No external visitors" data-pt="Sem visitas externas" data-es="Sin visitas externas" data-fr="Pas de visiteurs extérieurs">No external visitors</span></div>
      <div class="rule"><div class="rule-icon">👥</div><span data-en="Maximum 6 guests" data-pt="Máximo 6 hóspedes" data-es="Máximo 6 huéspedes" data-fr="Maximum 6 personnes">Maximum 6 guests</span></div>
      <div class="divider"></div>
      <p class="tip" data-en="🗑️ Bins: take rubbish out in the evening. When you leave the building, the bins are on the right, in front of Café Dragão on the corner by the traffic lights." data-pt="🗑️ Lixo: coloca o lixo à noite. Ao sair do prédio, os caixotes ficam do lado direito, em frente ao Café Dragão, na esquina junto ao semáforo." data-es="🗑️ Basura: saca la basura por la noche. Al salir del edificio, los contenedores están a la derecha, frente al Café Dragão en la esquina junto al semáforo." data-fr="🗑️ Poubelles : sortez les ordures le soir. En sortant de l'immeuble, les poubelles sont à droite, devant le Café Dragão au coin près des feux.">🗑️ Bins: take rubbish out in the evening. When you leave the building, the bins are on the right, in front of Café Dragão on the corner by the traffic lights.</p>
    </div>
  </div>

  <!-- EMERGENCY -->
  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🆘</div>
      <div class="section-title" data-en="Emergency contacts" data-pt="Contactos de emergência" data-es="Contactos de emergencia" data-fr="Contacts d'urgence">Emergency contacts</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="emergency-box">
        <div class="emergency-title" data-en="Emergency numbers" data-pt="Números de emergência" data-es="Números de emergencia" data-fr="Numéros d'urgence">Emergency numbers</div>
        <div class="emergency-row"><span class="emergency-label" data-en="Emergency (EU)" data-pt="Emergência (EU)" data-es="Emergencias (UE)" data-fr="Urgences (UE)">Emergency (EU)</span><span class="emergency-num">112</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Police (PSP)" data-pt="Polícia (PSP)" data-es="Policía (PSP)" data-fr="Police (PSP)">Police (PSP)</span><span class="emergency-num">222 092 000</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Hospital St António" data-pt="Hospital St António" data-es="Hospital St António" data-fr="Hôpital St António">Hospital St António</span><span class="emergency-num">222 077 500</span></div>
      </div>
      <p class="tip" style="margin-top:0.75rem" data-en="For any issue with the apartment, please message us directly through your booking platform and we'll get back to you as soon as possible." data-pt="Para qualquer problema com o apartamento, envia-nos uma mensagem pela plataforma de reserva e responderemos o mais brevemente possível." data-es="Para cualquier problema con el apartamento, envíanos un mensaje a través de tu plataforma de reserva y te responderemos lo antes posible." data-fr="Pour tout problème avec l'appartement, envoyez-nous un message via votre plateforme de réservation et nous vous répondrons dès que possible.">For any issue with the apartment, please message us directly through your booking platform and we'll get back to you as soon as possible.</p>
    </div>
  </div>

</div>

<div class="footer">
  <p data-en="Porto Haven · Alegria 93 · We hope you have a wonderful stay!" data-pt="Porto Haven · Alegria 93 · Esperamos que tenhas uma estadia maravilhosa!">Porto Haven · Alegria 93 · We hope you have a wonderful stay!</p>
</div>

<script>
function toggle(header){
  const body=header.nextElementSibling;
  const open=body.classList.contains('open');
  body.classList.toggle('open',!open);
  header.classList.toggle('open',!open);
}
function setLang(lang){
  document.querySelectorAll('[data-en]').forEach(el=>{
    el.textContent=el.getAttribute('data-'+lang)||el.getAttribute('data-en');
  });
  const map={'en':'English','pt':'Português','es':'Español','fr':'Français'};
  document.querySelectorAll('.lang-btn').forEach(btn=>{
    btn.classList.toggle('active',btn.textContent===map[lang]);
  });
}
</script>
</body>
</html>`;

async function getActiveBookings() {
  const today = new Date().toISOString().split('T')[0];
  const future90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const response = await fetch(
    `https://login.smoobu.com/api/reservations?apartmentId=${APARTMENT_ID}&departureFrom=${today}&arrivalTo=${future90}&pageSize=50`,
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
  const alertBody = `⚠️ ALERTA IA: Mensagem requer a tua atenção:\n\n"${guestMessage}"\n\n— Assistente Alegria 93`;
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
  const phrases = ["passing this to our host","vou passar ao anfitrião","paso esto al anfitrión","je transmets"];
  return phrases.some(p => aiResponse.toLowerCase().includes(p.toLowerCase()));
}

async function checkNewMessages() {
  console.log('🔍 A verificar mensagens novas...');
  try {
    const data = await getActiveBookings();
    const bookings = data.bookings || [];
    console.log(`📋 ${bookings.length} reservas encontradas`);
    for (const booking of bookings) {
      try {
        const messagesData = await getReservationMessages(booking.id);
        const messages = messagesData.messages || [];
        if (!messages.length) continue;
        const maxId = Math.max(...messages.map(m => m.id));
        if (lastSeenMessageId[booking.id] === undefined) {
          lastSeenMessageId[booking.id] = maxId;
          console.log(`⏭️ Reserva ${booking.id}: inicializada (última msg ID: ${maxId})`);
          continue;
        }
        const newGuestMessages = messages.filter(m => m.id > lastSeenMessageId[booking.id] && m.type === 1);
        if (!newGuestMessages.length) continue;
        const lastNew = newGuestMessages[newGuestMessages.length - 1];
        console.log(`💬 Nova mensagem na reserva ${booking.id}: ${lastNew.message}`);
        const history = messages.filter(m => m.id < lastNew.id).map(m => ({ role: m.type === 1 ? 'user' : 'assistant', content: m.message }));
        const aiResponse = await generateAIResponse(lastNew.message, history);
        if (!aiResponse) continue;
        console.log(`🤖 Resposta IA: ${aiResponse}`);
        await sendMessageToGuest(booking.id, aiResponse);
        lastSeenMessageId[booking.id] = maxId;
        console.log(`✅ Resposta enviada (reserva ${booking.id})`);
        if (needsEscalation(aiResponse)) {
          await sendAlertToHost(booking.id, lastNew.message);
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

setInterval(checkNewMessages, 60 * 1000);
setTimeout(checkNewMessages, 3000);

app.post('/webhook', (req, res) => res.json({ status: 'received' }));

const GUIDE_CEDOFEITA_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Porto Haven — Cedofeita · Guest Guide</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0;color:#1a1a1a;min-height:100vh}
.hero{background:#1a1a1a;color:#fff;padding:2rem 1.25rem 1.5rem}
.hero-tag{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:6px}
.hero-title{font-size:26px;font-weight:600;margin-bottom:4px}
.hero-sub{font-size:14px;color:#aaa;margin-bottom:1.25rem}
.lang-toggle{display:flex;gap:8px}
.lang-btn{padding:6px 16px;border-radius:20px;border:1px solid #444;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s}
.lang-btn.active{background:#fff;color:#1a1a1a;border-color:#fff}
.hero-map{display:inline-flex;align-items:center;gap:6px;margin-top:1rem;color:#ccc;font-size:13px;text-decoration:none;border-bottom:1px solid #444;padding-bottom:2px}
.container{max-width:600px;margin:0 auto;padding:1rem}
.section{background:#fff;border-radius:12px;margin-bottom:0.75rem;overflow:hidden;border:1px solid #ece9e3}
.section-header{display:flex;align-items:center;gap:10px;padding:1rem 1.25rem;cursor:pointer;user-select:none}
.section-icon{width:32px;height:32px;border-radius:8px;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-title{font-size:15px;font-weight:600;flex:1;color:#1a1a1a}
.section-chevron{font-size:18px;color:#999;transition:transform 0.25s}
.section-body{padding:0 1.25rem 1.25rem;display:none}
.section-body.open{display:block}
.section-header.open .section-chevron{transform:rotate(180deg)}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0.75rem}
.info-card{background:#f7f5f0;border-radius:8px;padding:0.75rem}
.info-card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.info-card-value{font-size:15px;font-weight:600;color:#1a1a1a}
.wifi-box{background:#1a1a1a;color:#fff;border-radius:10px;padding:1rem 1.25rem;margin-bottom:8px}
.wifi-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.wifi-value{font-size:16px;font-weight:600;font-family:monospace;letter-spacing:0.05em}
.place{padding:10px 0;border-bottom:1px solid #f0ede8}
.place:last-child{border-bottom:none}
.place-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}
.place-name{font-size:14px;font-weight:600;color:#1a1a1a}
.place-rating{font-size:12px;color:#f59e0b;font-weight:600;white-space:nowrap}
.place-desc{font-size:12px;color:#666;line-height:1.4;margin-bottom:5px}
.place-meta{font-size:11px;color:#999;margin-bottom:5px}
.map-link{font-size:12px;color:#2563eb;text-decoration:none;display:inline-flex;align-items:center;gap:3px}
.badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:10px;margin-left:5px;font-weight:500}
.badge-reserve{background:#ede9fe;color:#5b21b6}
.rule{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0ede8;font-size:14px}
.rule:last-child{border-bottom:none}
.rule-icon{font-size:16px;width:24px;text-align:center}
.tip{font-size:13px;color:#555;line-height:1.5;padding:8px 0}
.service-item{padding:10px 0;border-bottom:1px solid #f0ede8}
.service-item:last-child{border-bottom:none}
.service-name{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
.service-desc{font-size:12px;color:#666;margin-bottom:5px}
.divider{height:1px;background:#f0ede8;margin:10px 0}
.footer{text-align:center;padding:2rem 1rem;color:#999;font-size:12px}
.emergency-box{background:#fff1f1;border:1px solid #fecaca;border-radius:10px;padding:1rem 1.25rem}
.emergency-title{font-size:13px;font-weight:600;color:#991b1b;margin-bottom:8px}
.emergency-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #fecaca}
.emergency-row:last-child{border-bottom:none}
.emergency-label{color:#666}
.emergency-num{font-weight:600;color:#1a1a1a}
</style>
</head>
<body>

<div class="hero">
  <div class="hero-tag">Porto Haven</div>
  <div class="hero-title">Porto Haven — Cedofeita</div>
  <div class="hero-sub">Rua de Cedofeita, 213 · 1º andar · Porto</div>
  <div class="lang-toggle">
    <button class="lang-btn active" onclick="setLang('en')">English</button>
    <button class="lang-btn" onclick="setLang('pt')">Português</button>
    <button class="lang-btn" onclick="setLang('es')">Español</button>
    <button class="lang-btn" onclick="setLang('fr')">Français</button>
  </div>
  <a href="https://maps.google.com/?q=Rua+de+Cedofeita+213+Porto" target="_blank" class="hero-map">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
</div>

<div class="container">

  <div class="section">
    <div class="section-header open" onclick="toggle(this)">
      <div class="section-icon">🔑</div>
      <div class="section-title" data-en="Check-in & check-out" data-pt="Check-in & check-out" data-es="Check-in & check-out" data-fr="Check-in & check-out">Check-in & check-out</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body open">
      <div class="info-grid">
        <div class="info-card"><div class="info-card-label" data-en="Check-in" data-pt="Check-in" data-es="Check-in" data-fr="Check-in">Check-in</div><div class="info-card-value">16:00 – 00:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Check-out" data-pt="Check-out" data-es="Check-out" data-fr="Check-out">Check-out</div><div class="info-card-value" data-en="by 11:00" data-pt="até às 11:00" data-es="antes de las 11:00" data-fr="avant 11h00">by 11:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (arrival)" data-pt="Deixar malas (chegada)" data-es="Dejar maletas (llegada)" data-fr="Déposer bagages (arrivée)">Drop bags (arrival)</div><div class="info-card-value" data-en="from 12:00" data-pt="a partir das 12:00" data-es="desde las 12:00" data-fr="à partir de 12h00">from 12:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (departure)" data-pt="Deixar malas (saída)" data-es="Dejar maletas (salida)" data-fr="Déposer bagages (départ)">Drop bags (departure)</div><div class="info-card-value" data-en="until 13:00" data-pt="até às 13:00" data-es="hasta las 13:00" data-fr="jusqu'à 13h00">until 13:00</div></div>
      </div>
      <p class="tip" data-en="Self check-in. Your access code is sent 48 hours before arrival. The building has a lift.</p>
      <p class="tip" data-en="Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum." data-pt="Infelizmente não conseguimos garantir early check-in ou late check-out pois normalmente estamos completamente reservados, mas podes deixar as malas no apartamento a partir das 12:00 no dia de chegada, ou deixar as malas no apartamento no dia de saída até às 13:00 no máximo." data-es="Lamentablemente no podemos ofrecer early check-in ni late check-out ya que normalmente estamos completos, pero puedes dejar tus maletas dentro del apartamento a partir de las 12:00 del día de llegada, o dejar tus maletas en el apartamento el día de salida hasta las 13:00 como máximo." data-fr="Malheureusement, nous ne pouvons pas proposer un check-in anticipé ou un check-out tardif car nous sommes généralement complets, mais vous pouvez déposer vos bagages dans l'appartement à partir de 12h00 le jour d'arrivée, ou laisser vos bagages dans l'appartement le jour du départ jusqu'à 13h00 maximum.">Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📶</div>
      <div class="section-title">Wi-Fi</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="wifi-box">
        <div class="wifi-label" data-en="Network" data-pt="Rede" data-es="Red" data-fr="Réseau">Network</div>
        <div class="wifi-value">Abacatur 1</div>
      </div>
      <div class="wifi-box">
        <div class="wifi-label">Password</div>
        <div class="wifi-value">@PHabacatur1*</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🍽️</div>
      <div class="section-title" data-en="Restaurants & cafés" data-pt="Restaurantes & cafés" data-es="Restaurantes & cafés" data-fr="Restaurants & cafés">Restaurants & cafés</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-header"><div class="place-name">1858 BBGourmet Criativo</div><div class="place-rating">⭐ fine dining</div></div>
        <div class="place-desc" data-en="Creative fine dining, one of the best restaurants in Porto. Right on your street." data-pt="Fine dining criativo, um dos melhores restaurantes do Porto. Mesmo na tua rua.">Creative fine dining, one of the best restaurants in Porto. Right on your street.</div>
        <div class="place-meta" data-en="Daily 12:00–22:30 (Fri–Sat until 23:00)" data-pt="Diário 12h–22h30 (Sex–Sáb até 23h)">Daily 12:00–22:30 (Fri–Sat until 23:00)</div>
        <a href="https://maps.google.com/?q=1858+BBGourmet+Criativo+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Capim Dourado</div><div class="place-rating">⭐ Brazilian</div></div>
        <div class="place-desc" data-en="Excellent Brazilian cuisine with a Porto twist. Lively atmosphere, great flavours." data-pt="Excelente cozinha brasileira com toque portuense. Ambiente animado, sabores ótimos.">Excellent Brazilian cuisine with a Porto twist. Lively atmosphere, great flavours.</div>
        <div class="place-meta" data-en="Mon–Thu 19:30–23:00 · Fri–Sat 19:30–00:00 · Sun 12:30–16:00 & 19:30–23:00" data-pt="Seg–Qui 19h30–23h · Sex–Sáb 19h30–00h · Dom 12h30–16h & 19h30–23h">Mon–Thu 19:30–23:00 · Fri–Sat 19:30–00:00 · Sun 12:30–16:00 & 19:30–23:00</div>
        <a href="https://maps.google.com/?q=Capim+Dourado+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Restaurante Rittos</div><div class="place-rating">⭐ Portuguese</div></div>
        <div class="place-desc" data-en="Classic Portuguese tavern, great value. A neighbourhood staple." data-pt="Taberna portuguesa clássica, excelente relação qualidade-preço. Um clássico do bairro.">Classic Portuguese tavern, great value. A neighbourhood staple.</div>
        <div class="place-meta" data-en="Mon–Fri 9:00–18:00 · Sat 9:00–17:00" data-pt="Seg–Sex 9h–18h · Sáb 9h–17h">Mon–Fri 9:00–18:00 · Sat 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Restaurante+Rittos+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">LM Art Kitchen</div><div class="place-rating">⭐ garden terrace</div></div>
        <div class="place-desc" data-en="Lovely garden terrace, great for brunch and lunch. Creative menu in a relaxed setting." data-pt="Linda esplanada com jardim, ótimo para brunch e almoço. Menu criativo em ambiente descontraído.">Lovely garden terrace, great for brunch and lunch. Creative menu in a relaxed setting.</div>
        <div class="place-meta" data-en="Weekdays 10:00–18:00 · Weekends 9:00–19:00" data-pt="Dias de semana 10h–18h · Fins de semana 9h–19h">Weekdays 10:00–18:00 · Weekends 9:00–19:00</div>
        <a href="https://maps.google.com/?q=LM+Art+Kitchen+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Cafés & brunch" data-pt="Cafés & brunch" data-es="Cafés & brunch" data-fr="Cafés & brunch">Cafés & brunch</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Comum</div><div class="place-rating">⭐ specialty coffee</div></div>
        <div class="place-desc" data-en="Specialty coffee, shakshuka and a sunny courtyard. A Cedofeita favourite." data-pt="Café de especialidade, shakshuka e pátio ensolarado. Um favorito de Cedofeita.">Specialty coffee, shakshuka and a sunny courtyard. A Cedofeita favourite.</div>
        <div class="place-meta" data-en="Daily 9:00–17:00" data-pt="Diário 9h–17h">Daily 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Comum+cafe+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">BEIJI café & pâtisserie</div><div class="place-rating">⭐ pastries</div></div>
        <div class="place-desc" data-en="Cosy and charming with beautiful pastries. A lovely spot for breakfast." data-pt="Acolhedor e encantador com pastéis deliciosos. Ótimo para o pequeno-almoço.">Cosy and charming with beautiful pastries. A lovely spot for breakfast.</div>
        <div class="place-meta" data-en="Tue–Sun 9:00–18:00" data-pt="Ter–Dom 9h–18h">Tue–Sun 9:00–18:00</div>
        <a href="https://maps.google.com/?q=BEIJI+cafe+patisserie+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Apartamento Coffee & Snacks</div><div class="place-rating">⭐ pancakes</div></div>
        <div class="place-desc" data-en="Fluffy pancakes and great latte art. Perfect for a lazy morning." data-pt="Panquecas fofas e latte art incrível. Perfeito para uma manhã preguiçosa.">Fluffy pancakes and great latte art. Perfect for a lazy morning.</div>
        <div class="place-meta" data-en="Mon, Sat & Sun 9:00–17:00" data-pt="Seg, Sáb & Dom 9h–17h">Mon, Sat & Sun 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Apartamento+Coffee+Snacks+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Rooftop bars" data-pt="Rooftop bars" data-es="Bares en azotea" data-fr="Bars en terrasse">Rooftop bars</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Terraço do Jardim</div><div class="place-rating">⭐ 4.4 · city views</div></div>
        <div class="place-desc" data-en="Rooftop lounge with stunning city views, great cocktails and a warm atmosphere." data-pt="Rooftop com vistas deslumbrantes da cidade, cocktails e ambiente acolhedor.">Rooftop lounge with stunning city views, great cocktails and a warm atmosphere.</div>
        <div class="place-meta" data-en="Daily 11:00–00:00" data-pt="Diário 11h–00h">Daily 11:00–00:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJh1ZsQQBlJA0RNY_5IS7Ix58" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Amura Bar & Rooftop</div><div class="place-rating">⭐ 4.5 · river views</div></div>
        <div class="place-desc" data-en="Beautiful rooftop overlooking the Douro river. Great atmosphere and friendly service." data-pt="Rooftop com vistas para o Douro. Excelente ambiente e serviço simpático.">Beautiful rooftop overlooking the Douro river. Great atmosphere and friendly service.</div>
        <div class="place-meta" data-en="Daily 11:00–23:30" data-pt="Diário 11h–23h30">Daily 11:00–23:30</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ31kEd4FlJA0R6My2TrmhC6o" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🛒</div>
      <div class="section-title" data-en="Supermarkets" data-pt="Supermercados" data-es="Supermercados" data-fr="Supermarchés">Supermarkets</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">SPAR Cedofeita</div>
        <div class="place-desc" data-en="Right next door at nº 230! Mon–Sat 10:00–21:30." data-pt="Mesmo ao lado, no nº 230! Seg–Sáb 10h–21h30.">Right next door at nº 230! Mon–Sat 10:00–21:30.</div>
        <a href="https://maps.google.com/?q=SPAR+Rua+Cedofeita+230+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name">Pingo Doce</div>
        <div class="place-desc" data-en="Full supermarket at nº 435, great for a proper shop. Daily 8:00–21:00." data-pt="Supermercado completo no nº 435, ótimo para fazer compras. Diário 8h–21h.">Full supermarket at nº 435, great for a proper shop. Daily 8:00–21:00.</div>
        <a href="https://maps.google.com/?q=Pingo+Doce+Rua+Cedofeita+435+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name">My Auchan</div>
        <div class="place-desc" data-en="At nº 80, open daily 8:00–21:00." data-pt="No nº 80, aberto todos os dias 8h–21h.">At nº 80, open daily 8:00–21:00.</div>
        <a href="https://maps.google.com/?q=Auchan+Rua+Cedofeita+80+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🚇</div>
      <div class="section-title" data-en="Getting around" data-pt="Transportes" data-es="Cómo moverse" data-fr="Se déplacer">Getting around</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name" data-en="Metro — Lapa (Yellow Line)" data-pt="Metro — Lapa (Linha Amarela)" data-es="Metro — Lapa (Línea Amarilla)" data-fr="Métro — Lapa (Ligne Jaune)">Metro — Lapa (Yellow Line)</div>
        <div class="service-desc" data-en="~5 min walk. Connects to Trindade (city centre hub) and Casa da Música." data-pt="~5 min a pé. Liga ao Trindade (centro) e à Casa da Música.">~5 min walk. Connects to Trindade (city centre hub) and Casa da Música.</div>
        <a href="https://maps.google.com/?q=Metro+Lapa+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Taxi / Rideshare" data-pt="Taxi / Rideshare" data-es="Taxi / Transporte privado" data-fr="Taxi / VTC">Taxi / Rideshare</div>
        <div class="service-desc" data-en="Taxi rank at Praça do Marquês (~10 min walk). Also available: Uber, Bolt, Free Now." data-pt="Praça de taxis no Marquês (~10 min a pé). Também disponível: Uber, Bolt, Free Now.">Taxi rank at Praça do Marquês (~10 min walk). Also available: Uber, Bolt, Free Now.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJX8i6JlhkJA0RKTZK8UjKbAU" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Airport transfer" data-pt="Transfer aeroporto" data-es="Traslado al aeropuerto" data-fr="Transfert aéroport">Airport transfer</div>
        <div class="service-desc" data-en="Book a direct ride to/from the apartment." data-pt="Reserva uma viagem direta de/para o apartamento.">Book a direct ride to/from the apartment.</div>
        <a href="https://welc.io/ps/RGpgPROV" target="_blank" class="map-link">🚗 <span data-en="Book transfer" data-pt="Reservar transfer" data-es="Reservar traslado" data-fr="Réserver un transfert">Book transfer</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🅿️</div>
      <div class="section-title" data-en="Parking" data-pt="Estacionamento" data-es="Aparcamiento" data-fr="Stationnement">Parking</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Luis Vaz Medeiros</div>
        <div class="place-desc" data-en="Rua de Cedofeita 457 · ~€10/day · Mon–Sat 8:00–21:00 (closed Sundays)." data-pt="Rua de Cedofeita 457 · ~€10/dia · Seg–Sáb 8h–21h (fechado domingos).">Rua de Cedofeita 457 · ~€10/day · Mon–Sat 8:00–21:00 (closed Sundays).</div>
      </div>
      <div class="place">
        <div class="place-name">Parking Recolhas</div>
        <div class="place-desc" data-en="Rua de Cedofeita 538 · ~€15/24h · Open 24 hours (confirm arrival with staff)." data-pt="Rua de Cedofeita 538 · ~€15/24h · Aberto 24h (confirma chegada com a equipa).">Rua de Cedofeita 538 · ~€15/24h · Open 24 hours (confirm arrival with staff).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🏪</div>
      <div class="section-title" data-en="Useful services nearby" data-pt="Serviços úteis perto" data-es="Servicios útiles cerca" data-fr="Services utiles à proximité">Useful services nearby</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Pharmacy" data-pt="Farmácia" data-es="Farmacia" data-fr="Pharmacie">Pharmacy</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Farmácia Figueiredo</div><div class="place-rating">⭐ 4.2</div></div>
        <div class="place-desc" data-en="Helpful and knowledgeable staff. Right on your street at nº 132." data-pt="Equipa prestável e conhecedora. Mesmo na tua rua, no nº 132.">Helpful and knowledgeable staff. Right on your street at nº 132.</div>
        <div class="place-meta" data-en="Mon–Fri 9:00–20:00 · Sat 9:00–13:00" data-pt="Seg–Sex 9h–20h · Sáb 9h–13h">Mon–Fri 9:00–20:00 · Sat 9:00–13:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJG9VsowJlJA0RGV1vss5sxdI" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Hair salon / Barber" data-pt="Cabeleireiro / Barbearia" data-es="Peluquería / Barbería" data-fr="Salon de coiffure / Barbier">Hair salon / Barber</p>
      <div class="place">
        <div class="place-header"><div class="place-name">TGS Barber</div><div class="place-rating">⭐ 4.9 · 93 reviews</div></div>
        <div class="place-desc" data-en="Excellent barber on your street at nº 561. Speaks English, very reasonable prices." data-pt="Excelente barbearia na tua rua, no nº 561. Fala inglês, preços muito razoáveis.">Excellent barber on your street at nº 561. Speaks English, very reasonable prices.</div>
        <div class="place-meta" data-en="Mon–Sat 9:00–21:00 · Sun 11:00–21:00" data-pt="Seg–Sáb 9h–21h · Dom 11h–21h">Mon–Sat 9:00–21:00 · Sun 11:00–21:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ1fDh5otlJA0RGmZIAdTatUY" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">GS Beauty Salon</div><div class="place-rating">⭐ 4.8 · hair & nails</div></div>
        <div class="place-desc" data-en="Hair colour, cuts and nail extensions. Professional and friendly. At nº 170." data-pt="Coloração, cortes e extensões de unhas. Profissional e simpático. No nº 170.">Hair colour, cuts and nail extensions. Professional and friendly. At nº 170.</div>
        <div class="place-meta" data-en="Daily 10:00–20:00" data-pt="Diário 10h–20h">Daily 10:00–20:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJc5H3qzdlJA0R_3bJ1fhNmSs" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Laundry" data-pt="Lavandaria" data-es="Lavandería" data-fr="Laverie">Laundry</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Conforto Limpeza</div><div class="place-rating">⭐ 4.7 · 117 reviews</div></div>
        <div class="place-desc" data-en="Drop-off and self-service. Wash, dry and fold available. Detergent included. Open daily 7:00–23:00." data-pt="Entrega e self-service. Lavar, secar e dobrar disponível. Detergente incluído. Diário 7h–23h.">Drop-off and self-service. Wash, dry and fold available. Detergent included. Open daily 7:00–23:00.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJpRUGl0RlJA0RM-AXxGD0oz4" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="ATM / Cash" data-pt="Multibanco" data-es="Cajero / Efectivo" data-fr="Distributeur / Espèces">ATM / Cash</p>
      <div class="place">
        <div class="place-name" data-en="Multibanco — Rua de Cedofeita" data-pt="Multibanco — Rua de Cedofeita" data-es="Cajero — Rua de Cedofeita" data-fr="Distributeur — Rua de Cedofeita">Multibanco — Rua de Cedofeita</div>
        <div class="place-desc" data-en="Use Multibanco (MB) machines — avoid Euronet ATMs on the street (very high fees)." data-pt="Usa máquinas Multibanco (MB) — evita os Euronet na rua (taxas muito altas).">Use Multibanco (MB) machines — avoid Euronet ATMs on the street (very high fees).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🧳</div>
      <div class="section-title" data-en="Luggage storage" data-pt="Guarda-bagagem" data-es="Consigna de equipaje" data-fr="Consigne à bagages">Luggage storage</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name">Bounce</div>
        <div class="service-desc" data-en="Storage locations nearby from €1/day. 5% discount with our link." data-pt="Locais de armazenamento perto, a partir de €1/dia. 5% de desconto com o nosso link.">Storage locations nearby from €1/day. 5% discount with our link.</div>
        <a href="https://go.bounce.com/PORTOHAVEN7471817336" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
      <div class="service-item">
        <div class="service-name">LUGGit</div>
        <div class="service-desc" data-en="Collects and delivers your bags wherever and whenever you want. 10% discount for our guests." data-pt="Recolhe e entrega a tua bagagem onde e quando quiseres. 10% de desconto para os nossos hóspedes.">Collects and delivers your bags wherever and whenever you want. 10% discount for our guests.</div>
        <a href="https://luggit.app/partner/porto-haven" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🗺️</div>
      <div class="section-title" data-en="Things to do" data-pt="O que visitar" data-es="Qué hacer" data-fr="À faire">Things to do</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Casa da Música</div>
        <div class="place-desc" data-en="Iconic concert hall, one of Porto's most striking buildings. Check the programme online." data-pt="Sala de concertos icónica, um dos edifícios mais marcantes do Porto. Consulta a programação online.">Iconic concert hall, one of Porto's most striking buildings. Check the programme online.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="São Bento Station" data-pt="Estação de São Bento" data-es="Estación de São Bento" data-fr="Gare de São Bento">São Bento Station</div>
        <div class="place-desc" data-en="Stunning azulejo tile panels. Free to enter — don't miss it." data-pt="Painéis de azulejos impressionantes. Entrada gratuita — não percas.">Stunning azulejo tile panels. Free to enter — don't miss it.</div>
      </div>
      <div class="place">
        <div class="place-name">Livraria Lello</div>
        <div class="place-desc" data-en="One of the world's most beautiful bookshops. Book tickets online to avoid queues." data-pt="Uma das livrarias mais bonitas do mundo. Compra bilhetes online para evitar filas.">One of the world's most beautiful bookshops. Book tickets online to avoid queues.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Ribeira & D. Luís Bridge" data-pt="Ribeira & Ponte D. Luís" data-es="Ribeira & Puente D. Luís" data-fr="Ribeira & Pont D. Luís">Ribeira & D. Luís Bridge</div>
        <div class="place-desc" data-en="Walk the riverside and cross to Gaia for Port wine cellars and stunning views." data-pt="Passeio junto ao rio e atravessa até Gaia para as caves de vinho do Porto e vistas deslumbrantes.">Walk the riverside and cross to Gaia for Port wine cellars and stunning views.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Rua das Flores & Avenida dos Aliados" data-pt="Rua das Flores & Avenida dos Aliados" data-es="Rua das Flores & Avenida dos Aliados" data-fr="Rua das Flores & Avenida dos Aliados">Rua das Flores & Avenida dos Aliados</div>
        <div class="place-desc" data-en="Beautiful pedestrian street and Porto's grand boulevard — both within walking distance." data-pt="Bela rua pedonal e a grande avenida do Porto — ambas a curta distância a pé.">Beautiful pedestrian street and Porto's grand boulevard — both within walking distance.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Torre dos Clérigos" data-pt="Torre dos Clérigos" data-es="Torre dos Clérigos" data-fr="Tour dos Clérigos">Torre dos Clérigos</div>
        <div class="place-desc" data-en="Iconic baroque tower with 360° panoramic views of Porto. Worth the climb." data-pt="Torre barroca icónica com vistas panorâmicas 360°. Vale bem a subida.">Iconic baroque tower with 360° panoramic views of Porto. Worth the climb.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Foz do Douro" data-pt="Foz do Douro" data-es="Foz do Douro" data-fr="Foz do Douro">Foz do Douro</div>
        <div class="place-desc" data-en="Where the Douro meets the Atlantic. Walk along Avenida Brasil and stop at Docemar for amazing croissants." data-pt="Onde o Douro encontra o Atlântico. Passeio pela Avenida Brasil e para no Docemar para croissants incríveis.">Where the Douro meets the Atlantic. Walk along Avenida Brasil and stop at Docemar for amazing croissants.</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📋</div>
      <div class="section-title" data-en="House rules" data-pt="Regras da casa" data-es="Normas de la casa" data-fr="Règles de la maison">House rules</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="rule"><div class="rule-icon">🚭</div><span data-en="No smoking" data-pt="Proibido fumar" data-es="Prohibido fumar" data-fr="Défense de fumer">No smoking</span></div>
      <div class="rule"><div class="rule-icon">🎉</div><span data-en="No parties or events" data-pt="Sem festas ou eventos" data-es="Sin fiestas ni eventos" data-fr="Pas de fêtes ni d'événements">No parties or events</span></div>
      <div class="rule"><div class="rule-icon">🐾</div><span data-en="No pets" data-pt="Sem animais" data-es="No se admiten mascotas" data-fr="Animaux interdits">No pets</span></div>
      <div class="rule"><div class="rule-icon">🚫</div><span data-en="No external visitors" data-pt="Sem visitas externas" data-es="Sin visitas externas" data-fr="Pas de visiteurs extérieurs">No external visitors</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🆘</div>
      <div class="section-title" data-en="Emergency contacts" data-pt="Contactos de emergência" data-es="Contactos de emergencia" data-fr="Contacts d'urgence">Emergency contacts</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="emergency-box">
        <div class="emergency-title" data-en="Emergency numbers" data-pt="Números de emergência" data-es="Números de emergencia" data-fr="Numéros d'urgence">Emergency numbers</div>
        <div class="emergency-row"><span class="emergency-label" data-en="Emergency (EU)" data-pt="Emergência (EU)" data-es="Emergencias (UE)" data-fr="Urgences (UE)">Emergency (EU)</span><span class="emergency-num">112</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Police (PSP)" data-pt="Polícia (PSP)" data-es="Policía (PSP)" data-fr="Police (PSP)">Police (PSP)</span><span class="emergency-num">222 092 000</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Hospital St António" data-pt="Hospital St António" data-es="Hospital St António" data-fr="Hôpital St António">Hospital St António</span><span class="emergency-num">222 077 500</span></div>
      </div>
      <p class="tip" style="margin-top:0.75rem" data-en="For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible." data-pt="Para qualquer problema com o apartamento, envia-nos uma mensagem pela plataforma de reserva e responderemos o mais brevemente possível." data-es="Para cualquier problema con el apartamento, envíanos un mensaje a través de tu plataforma de reserva y te responderemos lo antes posible." data-fr="Pour tout problème avec l'appartement, envoyez-nous un message via votre plateforme de réservation et nous vous répondrons dès que possible.">For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible.</p>
    </div>
  </div>

</div>

<div class="footer">
  <p data-en="Porto Haven · Cedofeita · We hope you have a wonderful stay!" data-pt="Porto Haven · Cedofeita · Esperamos que tenhas uma estadia maravilhosa!">Porto Haven · Cedofeita 101 · We hope you have a wonderful stay!</p>
</div>

<script>
function toggle(header){
  const body=header.nextElementSibling;
  const open=body.classList.contains('open');
  body.classList.toggle('open',!open);
  header.classList.toggle('open',!open);
}
function setLang(lang){
  document.querySelectorAll('[data-en]').forEach(el=>{
    el.textContent=el.getAttribute('data-'+lang)||el.getAttribute('data-en');
  });
  const map={'en':'English','pt':'Português','es':'Español','fr':'Français'};
  document.querySelectorAll('.lang-btn').forEach(btn=>{
    btn.classList.toggle('active',btn.textContent===map[lang]);
  });
}
</script>
</body>
</html>`;

app.get('/guia', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(GUIDE_HTML);
});

const GUIDE_CEDOFEITA2_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Porto Haven — Cedofeita 2º · Guest Guide</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0;color:#1a1a1a;min-height:100vh}
.hero{background:#1a1a1a;color:#fff;padding:2rem 1.25rem 1.5rem}
.hero-tag{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:6px}
.hero-title{font-size:26px;font-weight:600;margin-bottom:4px}
.hero-sub{font-size:14px;color:#aaa;margin-bottom:1.25rem}
.lang-toggle{display:flex;gap:8px}
.lang-btn{padding:6px 16px;border-radius:20px;border:1px solid #444;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s}
.lang-btn.active{background:#fff;color:#1a1a1a;border-color:#fff}
.hero-map{display:inline-flex;align-items:center;gap:6px;margin-top:1rem;color:#ccc;font-size:13px;text-decoration:none;border-bottom:1px solid #444;padding-bottom:2px}
.container{max-width:600px;margin:0 auto;padding:1rem}
.section{background:#fff;border-radius:12px;margin-bottom:0.75rem;overflow:hidden;border:1px solid #ece9e3}
.section-header{display:flex;align-items:center;gap:10px;padding:1rem 1.25rem;cursor:pointer;user-select:none}
.section-icon{width:32px;height:32px;border-radius:8px;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-title{font-size:15px;font-weight:600;flex:1;color:#1a1a1a}
.section-chevron{font-size:18px;color:#999;transition:transform 0.25s}
.section-body{padding:0 1.25rem 1.25rem;display:none}
.section-body.open{display:block}
.section-header.open .section-chevron{transform:rotate(180deg)}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0.75rem}
.info-card{background:#f7f5f0;border-radius:8px;padding:0.75rem}
.info-card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.info-card-value{font-size:15px;font-weight:600;color:#1a1a1a}
.wifi-box{background:#1a1a1a;color:#fff;border-radius:10px;padding:1rem 1.25rem;margin-bottom:8px}
.wifi-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.wifi-value{font-size:16px;font-weight:600;font-family:monospace;letter-spacing:0.05em}
.place{padding:10px 0;border-bottom:1px solid #f0ede8}
.place:last-child{border-bottom:none}
.place-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}
.place-name{font-size:14px;font-weight:600;color:#1a1a1a}
.place-rating{font-size:12px;color:#f59e0b;font-weight:600;white-space:nowrap}
.place-desc{font-size:12px;color:#666;line-height:1.4;margin-bottom:5px}
.place-meta{font-size:11px;color:#999;margin-bottom:5px}
.map-link{font-size:12px;color:#2563eb;text-decoration:none;display:inline-flex;align-items:center;gap:3px}
.badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:10px;margin-left:5px;font-weight:500}
.badge-reserve{background:#ede9fe;color:#5b21b6}
.rule{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0ede8;font-size:14px}
.rule:last-child{border-bottom:none}
.rule-icon{font-size:16px;width:24px;text-align:center}
.tip{font-size:13px;color:#555;line-height:1.5;padding:8px 0}
.service-item{padding:10px 0;border-bottom:1px solid #f0ede8}
.service-item:last-child{border-bottom:none}
.service-name{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
.service-desc{font-size:12px;color:#666;margin-bottom:5px}
.divider{height:1px;background:#f0ede8;margin:10px 0}
.footer{text-align:center;padding:2rem 1rem;color:#999;font-size:12px}
.emergency-box{background:#fff1f1;border:1px solid #fecaca;border-radius:10px;padding:1rem 1.25rem}
.emergency-title{font-size:13px;font-weight:600;color:#991b1b;margin-bottom:8px}
.emergency-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #fecaca}
.emergency-row:last-child{border-bottom:none}
.emergency-label{color:#666}
.emergency-num{font-weight:600;color:#1a1a1a}
</style>
</head>
<body>

<div class="hero">
  <div class="hero-tag">Porto Haven</div>
  <div class="hero-title">Porto Haven — Cedofeita</div>
  <div class="hero-sub">Rua de Cedofeita, 213 · 2º andar · Porto</div>
  <div class="lang-toggle">
    <button class="lang-btn active" onclick="setLang('en')">English</button>
    <button class="lang-btn" onclick="setLang('pt')">Português</button>
    <button class="lang-btn" onclick="setLang('es')">Español</button>
    <button class="lang-btn" onclick="setLang('fr')">Français</button>
  </div>
  <a href="https://maps.google.com/?q=Rua+de+Cedofeita+213+Porto" target="_blank" class="hero-map">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
</div>

<div class="container">

  <div class="section">
    <div class="section-header open" onclick="toggle(this)">
      <div class="section-icon">🔑</div>
      <div class="section-title" data-en="Check-in & check-out" data-pt="Check-in & check-out" data-es="Check-in & check-out" data-fr="Check-in & check-out">Check-in & check-out</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body open">
      <div class="info-grid">
        <div class="info-card"><div class="info-card-label" data-en="Check-in" data-pt="Check-in" data-es="Check-in" data-fr="Check-in">Check-in</div><div class="info-card-value">16:00 – 00:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Check-out" data-pt="Check-out" data-es="Check-out" data-fr="Check-out">Check-out</div><div class="info-card-value" data-en="by 11:00" data-pt="até às 11:00" data-es="antes de las 11:00" data-fr="avant 11h00">by 11:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (arrival)" data-pt="Deixar malas (chegada)" data-es="Dejar maletas (llegada)" data-fr="Déposer bagages (arrivée)">Drop bags (arrival)</div><div class="info-card-value" data-en="from 12:00" data-pt="a partir das 12:00" data-es="desde las 12:00" data-fr="à partir de 12h00">from 12:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (departure)" data-pt="Deixar malas (saída)" data-es="Dejar maletas (salida)" data-fr="Déposer bagages (départ)">Drop bags (departure)</div><div class="info-card-value" data-en="until 13:00" data-pt="até às 13:00" data-es="hasta las 13:00" data-fr="jusqu'à 13h00">until 13:00</div></div>
      </div>
      <p class="tip" data-en="Self check-in. Your access code is sent 48 hours before arrival. The building has a lift.</p>
      <p class="tip" data-en="Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum." data-pt="Infelizmente não conseguimos garantir early check-in ou late check-out pois normalmente estamos completamente reservados, mas podes deixar as malas no apartamento a partir das 12:00 no dia de chegada, ou deixar as malas no apartamento no dia de saída até às 13:00 no máximo." data-es="Lamentablemente no podemos ofrecer early check-in ni late check-out ya que normalmente estamos completos, pero puedes dejar tus maletas dentro del apartamento a partir de las 12:00 del día de llegada, o dejar tus maletas en el apartamento el día de salida hasta las 13:00 como máximo." data-fr="Malheureusement, nous ne pouvons pas proposer un check-in anticipé ou un check-out tardif car nous sommes généralement complets, mais vous pouvez déposer vos bagages dans l'appartement à partir de 12h00 le jour d'arrivée, ou laisser vos bagages dans l'appartement le jour du départ jusqu'à 13h00 maximum.">Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📶</div>
      <div class="section-title">Wi-Fi</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="wifi-box">
        <div class="wifi-label" data-en="Network" data-pt="Rede" data-es="Red" data-fr="Réseau">Network</div>
        <div class="wifi-value">Abacatur 2</div>
      </div>
      <div class="wifi-box">
        <div class="wifi-label">Password</div>
        <div class="wifi-value">@PHabacatur2_</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🍽️</div>
      <div class="section-title" data-en="Restaurants & cafés" data-pt="Restaurantes & cafés" data-es="Restaurantes & cafés" data-fr="Restaurants & cafés">Restaurants & cafés</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-header"><div class="place-name">1858 BBGourmet Criativo</div><div class="place-rating">⭐ fine dining</div></div>
        <div class="place-desc" data-en="Creative fine dining, one of the best restaurants in Porto. Right on your street." data-pt="Fine dining criativo, um dos melhores restaurantes do Porto. Mesmo na tua rua.">Creative fine dining, one of the best restaurants in Porto. Right on your street.</div>
        <div class="place-meta" data-en="Daily 12:00–22:30 (Fri–Sat until 23:00)" data-pt="Diário 12h–22h30 (Sex–Sáb até 23h)">Daily 12:00–22:30 (Fri–Sat until 23:00)</div>
        <a href="https://maps.google.com/?q=1858+BBGourmet+Criativo+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Capim Dourado</div><div class="place-rating">⭐ Brazilian</div></div>
        <div class="place-desc" data-en="Excellent Brazilian cuisine with a Porto twist. Lively atmosphere, great flavours." data-pt="Excelente cozinha brasileira com toque portuense. Ambiente animado, sabores ótimos.">Excellent Brazilian cuisine with a Porto twist. Lively atmosphere, great flavours.</div>
        <div class="place-meta" data-en="Mon–Thu 19:30–23:00 · Fri–Sat 19:30–00:00 · Sun 12:30–16:00 & 19:30–23:00" data-pt="Seg–Qui 19h30–23h · Sex–Sáb 19h30–00h · Dom 12h30–16h & 19h30–23h">Mon–Thu 19:30–23:00 · Fri–Sat 19:30–00:00 · Sun 12:30–16:00 & 19:30–23:00</div>
        <a href="https://maps.google.com/?q=Capim+Dourado+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Restaurante Rittos</div><div class="place-rating">⭐ Portuguese</div></div>
        <div class="place-desc" data-en="Classic Portuguese tavern, great value. A neighbourhood staple." data-pt="Taberna portuguesa clássica, excelente relação qualidade-preço. Um clássico do bairro.">Classic Portuguese tavern, great value. A neighbourhood staple.</div>
        <div class="place-meta" data-en="Mon–Fri 9:00–18:00 · Sat 9:00–17:00" data-pt="Seg–Sex 9h–18h · Sáb 9h–17h">Mon–Fri 9:00–18:00 · Sat 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Restaurante+Rittos+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">LM Art Kitchen</div><div class="place-rating">⭐ garden terrace</div></div>
        <div class="place-desc" data-en="Lovely garden terrace, great for brunch and lunch. Creative menu in a relaxed setting." data-pt="Linda esplanada com jardim, ótimo para brunch e almoço. Menu criativo em ambiente descontraído.">Lovely garden terrace, great for brunch and lunch. Creative menu in a relaxed setting.</div>
        <div class="place-meta" data-en="Weekdays 10:00–18:00 · Weekends 9:00–19:00" data-pt="Dias de semana 10h–18h · Fins de semana 9h–19h">Weekdays 10:00–18:00 · Weekends 9:00–19:00</div>
        <a href="https://maps.google.com/?q=LM+Art+Kitchen+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Cafés & brunch" data-pt="Cafés & brunch" data-es="Cafés & brunch" data-fr="Cafés & brunch">Cafés & brunch</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Comum</div><div class="place-rating">⭐ specialty coffee</div></div>
        <div class="place-desc" data-en="Specialty coffee, shakshuka and a sunny courtyard. A Cedofeita favourite." data-pt="Café de especialidade, shakshuka e pátio ensolarado. Um favorito de Cedofeita.">Specialty coffee, shakshuka and a sunny courtyard. A Cedofeita favourite.</div>
        <div class="place-meta" data-en="Daily 9:00–17:00" data-pt="Diário 9h–17h">Daily 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Comum+cafe+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">BEIJI café & pâtisserie</div><div class="place-rating">⭐ pastries</div></div>
        <div class="place-desc" data-en="Cosy and charming with beautiful pastries. A lovely spot for breakfast." data-pt="Acolhedor e encantador com pastéis deliciosos. Ótimo para o pequeno-almoço.">Cosy and charming with beautiful pastries. A lovely spot for breakfast.</div>
        <div class="place-meta" data-en="Tue–Sun 9:00–18:00" data-pt="Ter–Dom 9h–18h">Tue–Sun 9:00–18:00</div>
        <a href="https://maps.google.com/?q=BEIJI+cafe+patisserie+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Apartamento Coffee & Snacks</div><div class="place-rating">⭐ pancakes</div></div>
        <div class="place-desc" data-en="Fluffy pancakes and great latte art. Perfect for a lazy morning." data-pt="Panquecas fofas e latte art incrível. Perfeito para uma manhã preguiçosa.">Fluffy pancakes and great latte art. Perfect for a lazy morning.</div>
        <div class="place-meta" data-en="Mon, Sat & Sun 9:00–17:00" data-pt="Seg, Sáb & Dom 9h–17h">Mon, Sat & Sun 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Apartamento+Coffee+Snacks+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Rooftop bars" data-pt="Rooftop bars" data-es="Bares en azotea" data-fr="Bars en terrasse">Rooftop bars</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Terraço do Jardim</div><div class="place-rating">⭐ 4.4 · city views</div></div>
        <div class="place-desc" data-en="Rooftop lounge with stunning city views, great cocktails and a warm atmosphere." data-pt="Rooftop com vistas deslumbrantes da cidade, cocktails e ambiente acolhedor.">Rooftop lounge with stunning city views, great cocktails and a warm atmosphere.</div>
        <div class="place-meta" data-en="Daily 11:00–00:00" data-pt="Diário 11h–00h">Daily 11:00–00:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJh1ZsQQBlJA0RNY_5IS7Ix58" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Amura Bar & Rooftop</div><div class="place-rating">⭐ 4.5 · river views</div></div>
        <div class="place-desc" data-en="Beautiful rooftop overlooking the Douro river. Great atmosphere and friendly service." data-pt="Rooftop com vistas para o Douro. Excelente ambiente e serviço simpático.">Beautiful rooftop overlooking the Douro river. Great atmosphere and friendly service.</div>
        <div class="place-meta" data-en="Daily 11:00–23:30" data-pt="Diário 11h–23h30">Daily 11:00–23:30</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ31kEd4FlJA0R6My2TrmhC6o" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🛒</div>
      <div class="section-title" data-en="Supermarkets" data-pt="Supermercados" data-es="Supermercados" data-fr="Supermarchés">Supermarkets</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">SPAR Cedofeita</div>
        <div class="place-desc" data-en="Right next door at nº 230! Mon–Sat 10:00–21:30." data-pt="Mesmo ao lado, no nº 230! Seg–Sáb 10h–21h30.">Right next door at nº 230! Mon–Sat 10:00–21:30.</div>
        <a href="https://maps.google.com/?q=SPAR+Rua+Cedofeita+230+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name">Pingo Doce</div>
        <div class="place-desc" data-en="Full supermarket at nº 435, great for a proper shop. Daily 8:00–21:00." data-pt="Supermercado completo no nº 435, ótimo para fazer compras. Diário 8h–21h.">Full supermarket at nº 435, great for a proper shop. Daily 8:00–21:00.</div>
        <a href="https://maps.google.com/?q=Pingo+Doce+Rua+Cedofeita+435+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name">My Auchan</div>
        <div class="place-desc" data-en="At nº 80, open daily 8:00–21:00." data-pt="No nº 80, aberto todos os dias 8h–21h.">At nº 80, open daily 8:00–21:00.</div>
        <a href="https://maps.google.com/?q=Auchan+Rua+Cedofeita+80+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🚇</div>
      <div class="section-title" data-en="Getting around" data-pt="Transportes" data-es="Cómo moverse" data-fr="Se déplacer">Getting around</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name" data-en="Metro — Lapa (Yellow Line)" data-pt="Metro — Lapa (Linha Amarela)" data-es="Metro — Lapa (Línea Amarilla)" data-fr="Métro — Lapa (Ligne Jaune)">Metro — Lapa (Yellow Line)</div>
        <div class="service-desc" data-en="~5 min walk. Connects to Trindade (city centre hub) and Casa da Música." data-pt="~5 min a pé. Liga ao Trindade (centro) e à Casa da Música.">~5 min walk. Connects to Trindade (city centre hub) and Casa da Música.</div>
        <a href="https://maps.google.com/?q=Metro+Lapa+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Taxi / Rideshare" data-pt="Taxi / Rideshare" data-es="Taxi / Transporte privado" data-fr="Taxi / VTC">Taxi / Rideshare</div>
        <div class="service-desc" data-en="Taxi rank at Praça do Marquês (~10 min walk). Also available: Uber, Bolt, Free Now." data-pt="Praça de taxis no Marquês (~10 min a pé). Também disponível: Uber, Bolt, Free Now.">Taxi rank at Praça do Marquês (~10 min walk). Also available: Uber, Bolt, Free Now.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJX8i6JlhkJA0RKTZK8UjKbAU" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Airport transfer" data-pt="Transfer aeroporto" data-es="Traslado al aeropuerto" data-fr="Transfert aéroport">Airport transfer</div>
        <div class="service-desc" data-en="Book a direct ride to/from the apartment." data-pt="Reserva uma viagem direta de/para o apartamento.">Book a direct ride to/from the apartment.</div>
        <a href="https://welc.io/ps/RGpgPROV" target="_blank" class="map-link">🚗 <span data-en="Book transfer" data-pt="Reservar transfer" data-es="Reservar traslado" data-fr="Réserver un transfert">Book transfer</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🅿️</div>
      <div class="section-title" data-en="Parking" data-pt="Estacionamento" data-es="Aparcamiento" data-fr="Stationnement">Parking</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Luis Vaz Medeiros</div>
        <div class="place-desc" data-en="Rua de Cedofeita 457 · ~€10/day · Mon–Sat 8:00–21:00 (closed Sundays)." data-pt="Rua de Cedofeita 457 · ~€10/dia · Seg–Sáb 8h–21h (fechado domingos).">Rua de Cedofeita 457 · ~€10/day · Mon–Sat 8:00–21:00 (closed Sundays).</div>
      </div>
      <div class="place">
        <div class="place-name">Parking Recolhas</div>
        <div class="place-desc" data-en="Rua de Cedofeita 538 · ~€15/24h · Open 24 hours (confirm arrival with staff)." data-pt="Rua de Cedofeita 538 · ~€15/24h · Aberto 24h (confirma chegada com a equipa).">Rua de Cedofeita 538 · ~€15/24h · Open 24 hours (confirm arrival with staff).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🏪</div>
      <div class="section-title" data-en="Useful services nearby" data-pt="Serviços úteis perto" data-es="Servicios útiles cerca" data-fr="Services utiles à proximité">Useful services nearby</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Pharmacy" data-pt="Farmácia" data-es="Farmacia" data-fr="Pharmacie">Pharmacy</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Farmácia Figueiredo</div><div class="place-rating">⭐ 4.2</div></div>
        <div class="place-desc" data-en="Helpful and knowledgeable staff. Right on your street at nº 132." data-pt="Equipa prestável e conhecedora. Mesmo na tua rua, no nº 132.">Helpful and knowledgeable staff. Right on your street at nº 132.</div>
        <div class="place-meta" data-en="Mon–Fri 9:00–20:00 · Sat 9:00–13:00" data-pt="Seg–Sex 9h–20h · Sáb 9h–13h">Mon–Fri 9:00–20:00 · Sat 9:00–13:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJG9VsowJlJA0RGV1vss5sxdI" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Hair salon / Barber" data-pt="Cabeleireiro / Barbearia" data-es="Peluquería / Barbería" data-fr="Salon de coiffure / Barbier">Hair salon / Barber</p>
      <div class="place">
        <div class="place-header"><div class="place-name">TGS Barber</div><div class="place-rating">⭐ 4.9 · 93 reviews</div></div>
        <div class="place-desc" data-en="Excellent barber on your street at nº 561. Speaks English, very reasonable prices." data-pt="Excelente barbearia na tua rua, no nº 561. Fala inglês, preços muito razoáveis.">Excellent barber on your street at nº 561. Speaks English, very reasonable prices.</div>
        <div class="place-meta" data-en="Mon–Sat 9:00–21:00 · Sun 11:00–21:00" data-pt="Seg–Sáb 9h–21h · Dom 11h–21h">Mon–Sat 9:00–21:00 · Sun 11:00–21:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ1fDh5otlJA0RGmZIAdTatUY" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">GS Beauty Salon</div><div class="place-rating">⭐ 4.8 · hair & nails</div></div>
        <div class="place-desc" data-en="Hair colour, cuts and nail extensions. Professional and friendly. At nº 170." data-pt="Coloração, cortes e extensões de unhas. Profissional e simpático. No nº 170.">Hair colour, cuts and nail extensions. Professional and friendly. At nº 170.</div>
        <div class="place-meta" data-en="Daily 10:00–20:00" data-pt="Diário 10h–20h">Daily 10:00–20:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJc5H3qzdlJA0R_3bJ1fhNmSs" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Laundry" data-pt="Lavandaria" data-es="Lavandería" data-fr="Laverie">Laundry</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Conforto Limpeza</div><div class="place-rating">⭐ 4.7 · 117 reviews</div></div>
        <div class="place-desc" data-en="Drop-off and self-service. Wash, dry and fold available. Detergent included. Open daily 7:00–23:00." data-pt="Entrega e self-service. Lavar, secar e dobrar disponível. Detergente incluído. Diário 7h–23h.">Drop-off and self-service. Wash, dry and fold available. Detergent included. Open daily 7:00–23:00.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJpRUGl0RlJA0RM-AXxGD0oz4" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="ATM / Cash" data-pt="Multibanco" data-es="Cajero / Efectivo" data-fr="Distributeur / Espèces">ATM / Cash</p>
      <div class="place">
        <div class="place-name" data-en="Multibanco — Rua de Cedofeita" data-pt="Multibanco — Rua de Cedofeita" data-es="Cajero — Rua de Cedofeita" data-fr="Distributeur — Rua de Cedofeita">Multibanco — Rua de Cedofeita</div>
        <div class="place-desc" data-en="Use Multibanco (MB) machines — avoid Euronet ATMs on the street (very high fees)." data-pt="Usa máquinas Multibanco (MB) — evita os Euronet na rua (taxas muito altas).">Use Multibanco (MB) machines — avoid Euronet ATMs on the street (very high fees).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🧳</div>
      <div class="section-title" data-en="Luggage storage" data-pt="Guarda-bagagem" data-es="Consigna de equipaje" data-fr="Consigne à bagages">Luggage storage</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name">Bounce</div>
        <div class="service-desc" data-en="Storage locations nearby from €1/day. 5% discount with our link." data-pt="Locais de armazenamento perto, a partir de €1/dia. 5% de desconto com o nosso link.">Storage locations nearby from €1/day. 5% discount with our link.</div>
        <a href="https://go.bounce.com/PORTOHAVEN7471817336" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
      <div class="service-item">
        <div class="service-name">LUGGit</div>
        <div class="service-desc" data-en="Collects and delivers your bags wherever and whenever you want. 10% discount for our guests." data-pt="Recolhe e entrega a tua bagagem onde e quando quiseres. 10% de desconto para os nossos hóspedes.">Collects and delivers your bags wherever and whenever you want. 10% discount for our guests.</div>
        <a href="https://luggit.app/partner/porto-haven" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🗺️</div>
      <div class="section-title" data-en="Things to do" data-pt="O que visitar" data-es="Qué hacer" data-fr="À faire">Things to do</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Casa da Música</div>
        <div class="place-desc" data-en="Iconic concert hall, one of Porto's most striking buildings. Check the programme online." data-pt="Sala de concertos icónica, um dos edifícios mais marcantes do Porto. Consulta a programação online.">Iconic concert hall, one of Porto's most striking buildings. Check the programme online.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="São Bento Station" data-pt="Estação de São Bento" data-es="Estación de São Bento" data-fr="Gare de São Bento">São Bento Station</div>
        <div class="place-desc" data-en="Stunning azulejo tile panels. Free to enter — don't miss it." data-pt="Painéis de azulejos impressionantes. Entrada gratuita — não percas.">Stunning azulejo tile panels. Free to enter — don't miss it.</div>
      </div>
      <div class="place">
        <div class="place-name">Livraria Lello</div>
        <div class="place-desc" data-en="One of the world's most beautiful bookshops. Book tickets online to avoid queues." data-pt="Uma das livrarias mais bonitas do mundo. Compra bilhetes online para evitar filas.">One of the world's most beautiful bookshops. Book tickets online to avoid queues.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Ribeira & D. Luís Bridge" data-pt="Ribeira & Ponte D. Luís" data-es="Ribeira & Puente D. Luís" data-fr="Ribeira & Pont D. Luís">Ribeira & D. Luís Bridge</div>
        <div class="place-desc" data-en="Walk the riverside and cross to Gaia for Port wine cellars and stunning views." data-pt="Passeio junto ao rio e atravessa até Gaia para as caves de vinho do Porto e vistas deslumbrantes.">Walk the riverside and cross to Gaia for Port wine cellars and stunning views.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Rua das Flores & Avenida dos Aliados" data-pt="Rua das Flores & Avenida dos Aliados" data-es="Rua das Flores & Avenida dos Aliados" data-fr="Rua das Flores & Avenida dos Aliados">Rua das Flores & Avenida dos Aliados</div>
        <div class="place-desc" data-en="Beautiful pedestrian street and Porto's grand boulevard — both within walking distance." data-pt="Bela rua pedonal e a grande avenida do Porto — ambas a curta distância a pé.">Beautiful pedestrian street and Porto's grand boulevard — both within walking distance.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Torre dos Clérigos" data-pt="Torre dos Clérigos" data-es="Torre dos Clérigos" data-fr="Tour dos Clérigos">Torre dos Clérigos</div>
        <div class="place-desc" data-en="Iconic baroque tower with 360° panoramic views of Porto. Worth the climb." data-pt="Torre barroca icónica com vistas panorâmicas 360°. Vale bem a subida.">Iconic baroque tower with 360° panoramic views of Porto. Worth the climb.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Foz do Douro" data-pt="Foz do Douro" data-es="Foz do Douro" data-fr="Foz do Douro">Foz do Douro</div>
        <div class="place-desc" data-en="Where the Douro meets the Atlantic. Walk along Avenida Brasil and stop at Docemar for amazing croissants." data-pt="Onde o Douro encontra o Atlântico. Passeio pela Avenida Brasil e para no Docemar para croissants incríveis.">Where the Douro meets the Atlantic. Walk along Avenida Brasil and stop at Docemar for amazing croissants.</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📋</div>
      <div class="section-title" data-en="House rules" data-pt="Regras da casa" data-es="Normas de la casa" data-fr="Règles de la maison">House rules</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="rule"><div class="rule-icon">🚭</div><span data-en="No smoking" data-pt="Proibido fumar" data-es="Prohibido fumar" data-fr="Défense de fumer">No smoking</span></div>
      <div class="rule"><div class="rule-icon">🎉</div><span data-en="No parties or events" data-pt="Sem festas ou eventos" data-es="Sin fiestas ni eventos" data-fr="Pas de fêtes ni d'événements">No parties or events</span></div>
      <div class="rule"><div class="rule-icon">🐾</div><span data-en="No pets" data-pt="Sem animais" data-es="No se admiten mascotas" data-fr="Animaux interdits">No pets</span></div>
      <div class="rule"><div class="rule-icon">🚫</div><span data-en="No external visitors" data-pt="Sem visitas externas" data-es="Sin visitas externas" data-fr="Pas de visiteurs extérieurs">No external visitors</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🆘</div>
      <div class="section-title" data-en="Emergency contacts" data-pt="Contactos de emergência" data-es="Contactos de emergencia" data-fr="Contacts d'urgence">Emergency contacts</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="emergency-box">
        <div class="emergency-title" data-en="Emergency numbers" data-pt="Números de emergência" data-es="Números de emergencia" data-fr="Numéros d'urgence">Emergency numbers</div>
        <div class="emergency-row"><span class="emergency-label" data-en="Emergency (EU)" data-pt="Emergência (EU)" data-es="Emergencias (UE)" data-fr="Urgences (UE)">Emergency (EU)</span><span class="emergency-num">112</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Police (PSP)" data-pt="Polícia (PSP)" data-es="Policía (PSP)" data-fr="Police (PSP)">Police (PSP)</span><span class="emergency-num">222 092 000</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Hospital St António" data-pt="Hospital St António" data-es="Hospital St António" data-fr="Hôpital St António">Hospital St António</span><span class="emergency-num">222 077 500</span></div>
      </div>
      <p class="tip" style="margin-top:0.75rem" data-en="For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible." data-pt="Para qualquer problema com o apartamento, envia-nos uma mensagem pela plataforma de reserva e responderemos o mais brevemente possível." data-es="Para cualquier problema con el apartamento, envíanos un mensaje a través de tu plataforma de reserva y te responderemos lo antes posible." data-fr="Pour tout problème avec l'appartement, envoyez-nous un message via votre plateforme de réservation et nous vous répondrons dès que possible.">For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible.</p>
    </div>
  </div>

</div>

<div class="footer">
  <p data-en="Porto Haven · Cedofeita · We hope you have a wonderful stay!" data-pt="Porto Haven · Cedofeita · Esperamos que tenhas uma estadia maravilhosa!">Porto Haven · Cedofeita 101 · We hope you have a wonderful stay!</p>
</div>

<script>
function toggle(header){
  const body=header.nextElementSibling;
  const open=body.classList.contains('open');
  body.classList.toggle('open',!open);
  header.classList.toggle('open',!open);
}
function setLang(lang){
  document.querySelectorAll('[data-en]').forEach(el=>{
    el.textContent=el.getAttribute('data-'+lang)||el.getAttribute('data-en');
  });
  const map={'en':'English','pt':'Português','es':'Español','fr':'Français'};
  document.querySelectorAll('.lang-btn').forEach(btn=>{
    btn.classList.toggle('active',btn.textContent===map[lang]);
  });
}
</script>
</body>
</html>`;

const GUIDE_CEDOFEITA3_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Porto Haven — Cedofeita 3º · Guest Guide</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0;color:#1a1a1a;min-height:100vh}
.hero{background:#1a1a1a;color:#fff;padding:2rem 1.25rem 1.5rem}
.hero-tag{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:6px}
.hero-title{font-size:26px;font-weight:600;margin-bottom:4px}
.hero-sub{font-size:14px;color:#aaa;margin-bottom:1.25rem}
.lang-toggle{display:flex;gap:8px}
.lang-btn{padding:6px 16px;border-radius:20px;border:1px solid #444;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s}
.lang-btn.active{background:#fff;color:#1a1a1a;border-color:#fff}
.hero-map{display:inline-flex;align-items:center;gap:6px;margin-top:1rem;color:#ccc;font-size:13px;text-decoration:none;border-bottom:1px solid #444;padding-bottom:2px}
.container{max-width:600px;margin:0 auto;padding:1rem}
.section{background:#fff;border-radius:12px;margin-bottom:0.75rem;overflow:hidden;border:1px solid #ece9e3}
.section-header{display:flex;align-items:center;gap:10px;padding:1rem 1.25rem;cursor:pointer;user-select:none}
.section-icon{width:32px;height:32px;border-radius:8px;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-title{font-size:15px;font-weight:600;flex:1;color:#1a1a1a}
.section-chevron{font-size:18px;color:#999;transition:transform 0.25s}
.section-body{padding:0 1.25rem 1.25rem;display:none}
.section-body.open{display:block}
.section-header.open .section-chevron{transform:rotate(180deg)}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0.75rem}
.info-card{background:#f7f5f0;border-radius:8px;padding:0.75rem}
.info-card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.info-card-value{font-size:15px;font-weight:600;color:#1a1a1a}
.wifi-box{background:#1a1a1a;color:#fff;border-radius:10px;padding:1rem 1.25rem;margin-bottom:8px}
.wifi-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.wifi-value{font-size:16px;font-weight:600;font-family:monospace;letter-spacing:0.05em}
.place{padding:10px 0;border-bottom:1px solid #f0ede8}
.place:last-child{border-bottom:none}
.place-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}
.place-name{font-size:14px;font-weight:600;color:#1a1a1a}
.place-rating{font-size:12px;color:#f59e0b;font-weight:600;white-space:nowrap}
.place-desc{font-size:12px;color:#666;line-height:1.4;margin-bottom:5px}
.place-meta{font-size:11px;color:#999;margin-bottom:5px}
.map-link{font-size:12px;color:#2563eb;text-decoration:none;display:inline-flex;align-items:center;gap:3px}
.badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:10px;margin-left:5px;font-weight:500}
.badge-reserve{background:#ede9fe;color:#5b21b6}
.rule{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0ede8;font-size:14px}
.rule:last-child{border-bottom:none}
.rule-icon{font-size:16px;width:24px;text-align:center}
.tip{font-size:13px;color:#555;line-height:1.5;padding:8px 0}
.service-item{padding:10px 0;border-bottom:1px solid #f0ede8}
.service-item:last-child{border-bottom:none}
.service-name{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
.service-desc{font-size:12px;color:#666;margin-bottom:5px}
.divider{height:1px;background:#f0ede8;margin:10px 0}
.footer{text-align:center;padding:2rem 1rem;color:#999;font-size:12px}
.emergency-box{background:#fff1f1;border:1px solid #fecaca;border-radius:10px;padding:1rem 1.25rem}
.emergency-title{font-size:13px;font-weight:600;color:#991b1b;margin-bottom:8px}
.emergency-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #fecaca}
.emergency-row:last-child{border-bottom:none}
.emergency-label{color:#666}
.emergency-num{font-weight:600;color:#1a1a1a}
</style>
</head>
<body>

<div class="hero">
  <div class="hero-tag">Porto Haven</div>
  <div class="hero-title">Porto Haven — Cedofeita</div>
  <div class="hero-sub">Rua de Cedofeita, 213 · 3º andar · Porto</div>
  <div class="lang-toggle">
    <button class="lang-btn active" onclick="setLang('en')">English</button>
    <button class="lang-btn" onclick="setLang('pt')">Português</button>
    <button class="lang-btn" onclick="setLang('es')">Español</button>
    <button class="lang-btn" onclick="setLang('fr')">Français</button>
  </div>
  <a href="https://maps.google.com/?q=Rua+de+Cedofeita+213+Porto" target="_blank" class="hero-map">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
</div>

<div class="container">

  <div class="section">
    <div class="section-header open" onclick="toggle(this)">
      <div class="section-icon">🔑</div>
      <div class="section-title" data-en="Check-in & check-out" data-pt="Check-in & check-out" data-es="Check-in & check-out" data-fr="Check-in & check-out">Check-in & check-out</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body open">
      <div class="info-grid">
        <div class="info-card"><div class="info-card-label" data-en="Check-in" data-pt="Check-in" data-es="Check-in" data-fr="Check-in">Check-in</div><div class="info-card-value">16:00 – 00:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Check-out" data-pt="Check-out" data-es="Check-out" data-fr="Check-out">Check-out</div><div class="info-card-value" data-en="by 11:00" data-pt="até às 11:00" data-es="antes de las 11:00" data-fr="avant 11h00">by 11:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (arrival)" data-pt="Deixar malas (chegada)" data-es="Dejar maletas (llegada)" data-fr="Déposer bagages (arrivée)">Drop bags (arrival)</div><div class="info-card-value" data-en="from 12:00" data-pt="a partir das 12:00" data-es="desde las 12:00" data-fr="à partir de 12h00">from 12:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (departure)" data-pt="Deixar malas (saída)" data-es="Dejar maletas (salida)" data-fr="Déposer bagages (départ)">Drop bags (departure)</div><div class="info-card-value" data-en="until 13:00" data-pt="até às 13:00" data-es="hasta las 13:00" data-fr="jusqu'à 13h00">until 13:00</div></div>
      </div>
      <p class="tip" data-en="Self check-in. Your access code is sent 48 hours before arrival. The building has a lift.</p>
      <p class="tip" data-en="Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum." data-pt="Infelizmente não conseguimos garantir early check-in ou late check-out pois normalmente estamos completamente reservados, mas podes deixar as malas no apartamento a partir das 12:00 no dia de chegada, ou deixar as malas no apartamento no dia de saída até às 13:00 no máximo." data-es="Lamentablemente no podemos ofrecer early check-in ni late check-out ya que normalmente estamos completos, pero puedes dejar tus maletas dentro del apartamento a partir de las 12:00 del día de llegada, o dejar tus maletas en el apartamento el día de salida hasta las 13:00 como máximo." data-fr="Malheureusement, nous ne pouvons pas proposer un check-in anticipé ou un check-out tardif car nous sommes généralement complets, mais vous pouvez déposer vos bagages dans l'appartement à partir de 12h00 le jour d'arrivée, ou laisser vos bagages dans l'appartement le jour du départ jusqu'à 13h00 maximum.">Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📶</div>
      <div class="section-title">Wi-Fi</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="wifi-box">
        <div class="wifi-label" data-en="Network" data-pt="Rede" data-es="Red" data-fr="Réseau">Network</div>
        <div class="wifi-value">Abacatur 3</div>
      </div>
      <div class="wifi-box">
        <div class="wifi-label">Password</div>
        <div class="wifi-value">@PHabacatur3*</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🍽️</div>
      <div class="section-title" data-en="Restaurants & cafés" data-pt="Restaurantes & cafés" data-es="Restaurantes & cafés" data-fr="Restaurants & cafés">Restaurants & cafés</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-header"><div class="place-name">1858 BBGourmet Criativo</div><div class="place-rating">⭐ fine dining</div></div>
        <div class="place-desc" data-en="Creative fine dining, one of the best restaurants in Porto. Right on your street." data-pt="Fine dining criativo, um dos melhores restaurantes do Porto. Mesmo na tua rua.">Creative fine dining, one of the best restaurants in Porto. Right on your street.</div>
        <div class="place-meta" data-en="Daily 12:00–22:30 (Fri–Sat until 23:00)" data-pt="Diário 12h–22h30 (Sex–Sáb até 23h)">Daily 12:00–22:30 (Fri–Sat until 23:00)</div>
        <a href="https://maps.google.com/?q=1858+BBGourmet+Criativo+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Capim Dourado</div><div class="place-rating">⭐ Brazilian</div></div>
        <div class="place-desc" data-en="Excellent Brazilian cuisine with a Porto twist. Lively atmosphere, great flavours." data-pt="Excelente cozinha brasileira com toque portuense. Ambiente animado, sabores ótimos.">Excellent Brazilian cuisine with a Porto twist. Lively atmosphere, great flavours.</div>
        <div class="place-meta" data-en="Mon–Thu 19:30–23:00 · Fri–Sat 19:30–00:00 · Sun 12:30–16:00 & 19:30–23:00" data-pt="Seg–Qui 19h30–23h · Sex–Sáb 19h30–00h · Dom 12h30–16h & 19h30–23h">Mon–Thu 19:30–23:00 · Fri–Sat 19:30–00:00 · Sun 12:30–16:00 & 19:30–23:00</div>
        <a href="https://maps.google.com/?q=Capim+Dourado+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Restaurante Rittos</div><div class="place-rating">⭐ Portuguese</div></div>
        <div class="place-desc" data-en="Classic Portuguese tavern, great value. A neighbourhood staple." data-pt="Taberna portuguesa clássica, excelente relação qualidade-preço. Um clássico do bairro.">Classic Portuguese tavern, great value. A neighbourhood staple.</div>
        <div class="place-meta" data-en="Mon–Fri 9:00–18:00 · Sat 9:00–17:00" data-pt="Seg–Sex 9h–18h · Sáb 9h–17h">Mon–Fri 9:00–18:00 · Sat 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Restaurante+Rittos+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">LM Art Kitchen</div><div class="place-rating">⭐ garden terrace</div></div>
        <div class="place-desc" data-en="Lovely garden terrace, great for brunch and lunch. Creative menu in a relaxed setting." data-pt="Linda esplanada com jardim, ótimo para brunch e almoço. Menu criativo em ambiente descontraído.">Lovely garden terrace, great for brunch and lunch. Creative menu in a relaxed setting.</div>
        <div class="place-meta" data-en="Weekdays 10:00–18:00 · Weekends 9:00–19:00" data-pt="Dias de semana 10h–18h · Fins de semana 9h–19h">Weekdays 10:00–18:00 · Weekends 9:00–19:00</div>
        <a href="https://maps.google.com/?q=LM+Art+Kitchen+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Cafés & brunch" data-pt="Cafés & brunch" data-es="Cafés & brunch" data-fr="Cafés & brunch">Cafés & brunch</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Comum</div><div class="place-rating">⭐ specialty coffee</div></div>
        <div class="place-desc" data-en="Specialty coffee, shakshuka and a sunny courtyard. A Cedofeita favourite." data-pt="Café de especialidade, shakshuka e pátio ensolarado. Um favorito de Cedofeita.">Specialty coffee, shakshuka and a sunny courtyard. A Cedofeita favourite.</div>
        <div class="place-meta" data-en="Daily 9:00–17:00" data-pt="Diário 9h–17h">Daily 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Comum+cafe+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">BEIJI café & pâtisserie</div><div class="place-rating">⭐ pastries</div></div>
        <div class="place-desc" data-en="Cosy and charming with beautiful pastries. A lovely spot for breakfast." data-pt="Acolhedor e encantador com pastéis deliciosos. Ótimo para o pequeno-almoço.">Cosy and charming with beautiful pastries. A lovely spot for breakfast.</div>
        <div class="place-meta" data-en="Tue–Sun 9:00–18:00" data-pt="Ter–Dom 9h–18h">Tue–Sun 9:00–18:00</div>
        <a href="https://maps.google.com/?q=BEIJI+cafe+patisserie+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Apartamento Coffee & Snacks</div><div class="place-rating">⭐ pancakes</div></div>
        <div class="place-desc" data-en="Fluffy pancakes and great latte art. Perfect for a lazy morning." data-pt="Panquecas fofas e latte art incrível. Perfeito para uma manhã preguiçosa.">Fluffy pancakes and great latte art. Perfect for a lazy morning.</div>
        <div class="place-meta" data-en="Mon, Sat & Sun 9:00–17:00" data-pt="Seg, Sáb & Dom 9h–17h">Mon, Sat & Sun 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Apartamento+Coffee+Snacks+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Rooftop bars" data-pt="Rooftop bars" data-es="Bares en azotea" data-fr="Bars en terrasse">Rooftop bars</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Terraço do Jardim</div><div class="place-rating">⭐ 4.4 · city views</div></div>
        <div class="place-desc" data-en="Rooftop lounge with stunning city views, great cocktails and a warm atmosphere." data-pt="Rooftop com vistas deslumbrantes da cidade, cocktails e ambiente acolhedor.">Rooftop lounge with stunning city views, great cocktails and a warm atmosphere.</div>
        <div class="place-meta" data-en="Daily 11:00–00:00" data-pt="Diário 11h–00h">Daily 11:00–00:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJh1ZsQQBlJA0RNY_5IS7Ix58" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Amura Bar & Rooftop</div><div class="place-rating">⭐ 4.5 · river views</div></div>
        <div class="place-desc" data-en="Beautiful rooftop overlooking the Douro river. Great atmosphere and friendly service." data-pt="Rooftop com vistas para o Douro. Excelente ambiente e serviço simpático.">Beautiful rooftop overlooking the Douro river. Great atmosphere and friendly service.</div>
        <div class="place-meta" data-en="Daily 11:00–23:30" data-pt="Diário 11h–23h30">Daily 11:00–23:30</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ31kEd4FlJA0R6My2TrmhC6o" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🛒</div>
      <div class="section-title" data-en="Supermarkets" data-pt="Supermercados" data-es="Supermercados" data-fr="Supermarchés">Supermarkets</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">SPAR Cedofeita</div>
        <div class="place-desc" data-en="Right next door at nº 230! Mon–Sat 10:00–21:30." data-pt="Mesmo ao lado, no nº 230! Seg–Sáb 10h–21h30.">Right next door at nº 230! Mon–Sat 10:00–21:30.</div>
        <a href="https://maps.google.com/?q=SPAR+Rua+Cedofeita+230+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name">Pingo Doce</div>
        <div class="place-desc" data-en="Full supermarket at nº 435, great for a proper shop. Daily 8:00–21:00." data-pt="Supermercado completo no nº 435, ótimo para fazer compras. Diário 8h–21h.">Full supermarket at nº 435, great for a proper shop. Daily 8:00–21:00.</div>
        <a href="https://maps.google.com/?q=Pingo+Doce+Rua+Cedofeita+435+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name">My Auchan</div>
        <div class="place-desc" data-en="At nº 80, open daily 8:00–21:00." data-pt="No nº 80, aberto todos os dias 8h–21h.">At nº 80, open daily 8:00–21:00.</div>
        <a href="https://maps.google.com/?q=Auchan+Rua+Cedofeita+80+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🚇</div>
      <div class="section-title" data-en="Getting around" data-pt="Transportes" data-es="Cómo moverse" data-fr="Se déplacer">Getting around</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name" data-en="Metro — Lapa (Yellow Line)" data-pt="Metro — Lapa (Linha Amarela)" data-es="Metro — Lapa (Línea Amarilla)" data-fr="Métro — Lapa (Ligne Jaune)">Metro — Lapa (Yellow Line)</div>
        <div class="service-desc" data-en="~5 min walk. Connects to Trindade (city centre hub) and Casa da Música." data-pt="~5 min a pé. Liga ao Trindade (centro) e à Casa da Música.">~5 min walk. Connects to Trindade (city centre hub) and Casa da Música.</div>
        <a href="https://maps.google.com/?q=Metro+Lapa+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Taxi / Rideshare" data-pt="Taxi / Rideshare" data-es="Taxi / Transporte privado" data-fr="Taxi / VTC">Taxi / Rideshare</div>
        <div class="service-desc" data-en="Taxi rank at Praça do Marquês (~10 min walk). Also available: Uber, Bolt, Free Now." data-pt="Praça de taxis no Marquês (~10 min a pé). Também disponível: Uber, Bolt, Free Now.">Taxi rank at Praça do Marquês (~10 min walk). Also available: Uber, Bolt, Free Now.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJX8i6JlhkJA0RKTZK8UjKbAU" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Airport transfer" data-pt="Transfer aeroporto" data-es="Traslado al aeropuerto" data-fr="Transfert aéroport">Airport transfer</div>
        <div class="service-desc" data-en="Book a direct ride to/from the apartment." data-pt="Reserva uma viagem direta de/para o apartamento.">Book a direct ride to/from the apartment.</div>
        <a href="https://welc.io/ps/RGpgPROV" target="_blank" class="map-link">🚗 <span data-en="Book transfer" data-pt="Reservar transfer" data-es="Reservar traslado" data-fr="Réserver un transfert">Book transfer</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🅿️</div>
      <div class="section-title" data-en="Parking" data-pt="Estacionamento" data-es="Aparcamiento" data-fr="Stationnement">Parking</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Luis Vaz Medeiros</div>
        <div class="place-desc" data-en="Rua de Cedofeita 457 · ~€10/day · Mon–Sat 8:00–21:00 (closed Sundays)." data-pt="Rua de Cedofeita 457 · ~€10/dia · Seg–Sáb 8h–21h (fechado domingos).">Rua de Cedofeita 457 · ~€10/day · Mon–Sat 8:00–21:00 (closed Sundays).</div>
      </div>
      <div class="place">
        <div class="place-name">Parking Recolhas</div>
        <div class="place-desc" data-en="Rua de Cedofeita 538 · ~€15/24h · Open 24 hours (confirm arrival with staff)." data-pt="Rua de Cedofeita 538 · ~€15/24h · Aberto 24h (confirma chegada com a equipa).">Rua de Cedofeita 538 · ~€15/24h · Open 24 hours (confirm arrival with staff).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🏪</div>
      <div class="section-title" data-en="Useful services nearby" data-pt="Serviços úteis perto" data-es="Servicios útiles cerca" data-fr="Services utiles à proximité">Useful services nearby</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Pharmacy" data-pt="Farmácia" data-es="Farmacia" data-fr="Pharmacie">Pharmacy</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Farmácia Figueiredo</div><div class="place-rating">⭐ 4.2</div></div>
        <div class="place-desc" data-en="Helpful and knowledgeable staff. Right on your street at nº 132." data-pt="Equipa prestável e conhecedora. Mesmo na tua rua, no nº 132.">Helpful and knowledgeable staff. Right on your street at nº 132.</div>
        <div class="place-meta" data-en="Mon–Fri 9:00–20:00 · Sat 9:00–13:00" data-pt="Seg–Sex 9h–20h · Sáb 9h–13h">Mon–Fri 9:00–20:00 · Sat 9:00–13:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJG9VsowJlJA0RGV1vss5sxdI" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Hair salon / Barber" data-pt="Cabeleireiro / Barbearia" data-es="Peluquería / Barbería" data-fr="Salon de coiffure / Barbier">Hair salon / Barber</p>
      <div class="place">
        <div class="place-header"><div class="place-name">TGS Barber</div><div class="place-rating">⭐ 4.9 · 93 reviews</div></div>
        <div class="place-desc" data-en="Excellent barber on your street at nº 561. Speaks English, very reasonable prices." data-pt="Excelente barbearia na tua rua, no nº 561. Fala inglês, preços muito razoáveis.">Excellent barber on your street at nº 561. Speaks English, very reasonable prices.</div>
        <div class="place-meta" data-en="Mon–Sat 9:00–21:00 · Sun 11:00–21:00" data-pt="Seg–Sáb 9h–21h · Dom 11h–21h">Mon–Sat 9:00–21:00 · Sun 11:00–21:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ1fDh5otlJA0RGmZIAdTatUY" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">GS Beauty Salon</div><div class="place-rating">⭐ 4.8 · hair & nails</div></div>
        <div class="place-desc" data-en="Hair colour, cuts and nail extensions. Professional and friendly. At nº 170." data-pt="Coloração, cortes e extensões de unhas. Profissional e simpático. No nº 170.">Hair colour, cuts and nail extensions. Professional and friendly. At nº 170.</div>
        <div class="place-meta" data-en="Daily 10:00–20:00" data-pt="Diário 10h–20h">Daily 10:00–20:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJc5H3qzdlJA0R_3bJ1fhNmSs" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Laundry" data-pt="Lavandaria" data-es="Lavandería" data-fr="Laverie">Laundry</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Conforto Limpeza</div><div class="place-rating">⭐ 4.7 · 117 reviews</div></div>
        <div class="place-desc" data-en="Drop-off and self-service. Wash, dry and fold available. Detergent included. Open daily 7:00–23:00." data-pt="Entrega e self-service. Lavar, secar e dobrar disponível. Detergente incluído. Diário 7h–23h.">Drop-off and self-service. Wash, dry and fold available. Detergent included. Open daily 7:00–23:00.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJpRUGl0RlJA0RM-AXxGD0oz4" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="ATM / Cash" data-pt="Multibanco" data-es="Cajero / Efectivo" data-fr="Distributeur / Espèces">ATM / Cash</p>
      <div class="place">
        <div class="place-name" data-en="Multibanco — Rua de Cedofeita" data-pt="Multibanco — Rua de Cedofeita" data-es="Cajero — Rua de Cedofeita" data-fr="Distributeur — Rua de Cedofeita">Multibanco — Rua de Cedofeita</div>
        <div class="place-desc" data-en="Use Multibanco (MB) machines — avoid Euronet ATMs on the street (very high fees)." data-pt="Usa máquinas Multibanco (MB) — evita os Euronet na rua (taxas muito altas).">Use Multibanco (MB) machines — avoid Euronet ATMs on the street (very high fees).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🧳</div>
      <div class="section-title" data-en="Luggage storage" data-pt="Guarda-bagagem" data-es="Consigna de equipaje" data-fr="Consigne à bagages">Luggage storage</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name">Bounce</div>
        <div class="service-desc" data-en="Storage locations nearby from €1/day. 5% discount with our link." data-pt="Locais de armazenamento perto, a partir de €1/dia. 5% de desconto com o nosso link.">Storage locations nearby from €1/day. 5% discount with our link.</div>
        <a href="https://go.bounce.com/PORTOHAVEN7471817336" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
      <div class="service-item">
        <div class="service-name">LUGGit</div>
        <div class="service-desc" data-en="Collects and delivers your bags wherever and whenever you want. 10% discount for our guests." data-pt="Recolhe e entrega a tua bagagem onde e quando quiseres. 10% de desconto para os nossos hóspedes.">Collects and delivers your bags wherever and whenever you want. 10% discount for our guests.</div>
        <a href="https://luggit.app/partner/porto-haven" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🗺️</div>
      <div class="section-title" data-en="Things to do" data-pt="O que visitar" data-es="Qué hacer" data-fr="À faire">Things to do</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Casa da Música</div>
        <div class="place-desc" data-en="Iconic concert hall, one of Porto's most striking buildings. Check the programme online." data-pt="Sala de concertos icónica, um dos edifícios mais marcantes do Porto. Consulta a programação online.">Iconic concert hall, one of Porto's most striking buildings. Check the programme online.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="São Bento Station" data-pt="Estação de São Bento" data-es="Estación de São Bento" data-fr="Gare de São Bento">São Bento Station</div>
        <div class="place-desc" data-en="Stunning azulejo tile panels. Free to enter — don't miss it." data-pt="Painéis de azulejos impressionantes. Entrada gratuita — não percas.">Stunning azulejo tile panels. Free to enter — don't miss it.</div>
      </div>
      <div class="place">
        <div class="place-name">Livraria Lello</div>
        <div class="place-desc" data-en="One of the world's most beautiful bookshops. Book tickets online to avoid queues." data-pt="Uma das livrarias mais bonitas do mundo. Compra bilhetes online para evitar filas.">One of the world's most beautiful bookshops. Book tickets online to avoid queues.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Ribeira & D. Luís Bridge" data-pt="Ribeira & Ponte D. Luís" data-es="Ribeira & Puente D. Luís" data-fr="Ribeira & Pont D. Luís">Ribeira & D. Luís Bridge</div>
        <div class="place-desc" data-en="Walk the riverside and cross to Gaia for Port wine cellars and stunning views." data-pt="Passeio junto ao rio e atravessa até Gaia para as caves de vinho do Porto e vistas deslumbrantes.">Walk the riverside and cross to Gaia for Port wine cellars and stunning views.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Rua das Flores & Avenida dos Aliados" data-pt="Rua das Flores & Avenida dos Aliados" data-es="Rua das Flores & Avenida dos Aliados" data-fr="Rua das Flores & Avenida dos Aliados">Rua das Flores & Avenida dos Aliados</div>
        <div class="place-desc" data-en="Beautiful pedestrian street and Porto's grand boulevard — both within walking distance." data-pt="Bela rua pedonal e a grande avenida do Porto — ambas a curta distância a pé.">Beautiful pedestrian street and Porto's grand boulevard — both within walking distance.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Torre dos Clérigos" data-pt="Torre dos Clérigos" data-es="Torre dos Clérigos" data-fr="Tour dos Clérigos">Torre dos Clérigos</div>
        <div class="place-desc" data-en="Iconic baroque tower with 360° panoramic views of Porto. Worth the climb." data-pt="Torre barroca icónica com vistas panorâmicas 360°. Vale bem a subida.">Iconic baroque tower with 360° panoramic views of Porto. Worth the climb.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Foz do Douro" data-pt="Foz do Douro" data-es="Foz do Douro" data-fr="Foz do Douro">Foz do Douro</div>
        <div class="place-desc" data-en="Where the Douro meets the Atlantic. Walk along Avenida Brasil and stop at Docemar for amazing croissants." data-pt="Onde o Douro encontra o Atlântico. Passeio pela Avenida Brasil e para no Docemar para croissants incríveis.">Where the Douro meets the Atlantic. Walk along Avenida Brasil and stop at Docemar for amazing croissants.</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📋</div>
      <div class="section-title" data-en="House rules" data-pt="Regras da casa" data-es="Normas de la casa" data-fr="Règles de la maison">House rules</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="rule"><div class="rule-icon">🚭</div><span data-en="No smoking" data-pt="Proibido fumar" data-es="Prohibido fumar" data-fr="Défense de fumer">No smoking</span></div>
      <div class="rule"><div class="rule-icon">🎉</div><span data-en="No parties or events" data-pt="Sem festas ou eventos" data-es="Sin fiestas ni eventos" data-fr="Pas de fêtes ni d'événements">No parties or events</span></div>
      <div class="rule"><div class="rule-icon">🐾</div><span data-en="No pets" data-pt="Sem animais" data-es="No se admiten mascotas" data-fr="Animaux interdits">No pets</span></div>
      <div class="rule"><div class="rule-icon">🚫</div><span data-en="No external visitors" data-pt="Sem visitas externas" data-es="Sin visitas externas" data-fr="Pas de visiteurs extérieurs">No external visitors</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🆘</div>
      <div class="section-title" data-en="Emergency contacts" data-pt="Contactos de emergência" data-es="Contactos de emergencia" data-fr="Contacts d'urgence">Emergency contacts</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="emergency-box">
        <div class="emergency-title" data-en="Emergency numbers" data-pt="Números de emergência" data-es="Números de emergencia" data-fr="Numéros d'urgence">Emergency numbers</div>
        <div class="emergency-row"><span class="emergency-label" data-en="Emergency (EU)" data-pt="Emergência (EU)" data-es="Emergencias (UE)" data-fr="Urgences (UE)">Emergency (EU)</span><span class="emergency-num">112</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Police (PSP)" data-pt="Polícia (PSP)" data-es="Policía (PSP)" data-fr="Police (PSP)">Police (PSP)</span><span class="emergency-num">222 092 000</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Hospital St António" data-pt="Hospital St António" data-es="Hospital St António" data-fr="Hôpital St António">Hospital St António</span><span class="emergency-num">222 077 500</span></div>
      </div>
      <p class="tip" style="margin-top:0.75rem" data-en="For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible." data-pt="Para qualquer problema com o apartamento, envia-nos uma mensagem pela plataforma de reserva e responderemos o mais brevemente possível." data-es="Para cualquier problema con el apartamento, envíanos un mensaje a través de tu plataforma de reserva y te responderemos lo antes posible." data-fr="Pour tout problème avec l'appartement, envoyez-nous un message via votre plateforme de réservation et nous vous répondrons dès que possible.">For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible.</p>
    </div>
  </div>

</div>

<div class="footer">
  <p data-en="Porto Haven · Cedofeita · We hope you have a wonderful stay!" data-pt="Porto Haven · Cedofeita · Esperamos que tenhas uma estadia maravilhosa!">Porto Haven · Cedofeita 101 · We hope you have a wonderful stay!</p>
</div>

<script>
function toggle(header){
  const body=header.nextElementSibling;
  const open=body.classList.contains('open');
  body.classList.toggle('open',!open);
  header.classList.toggle('open',!open);
}
function setLang(lang){
  document.querySelectorAll('[data-en]').forEach(el=>{
    el.textContent=el.getAttribute('data-'+lang)||el.getAttribute('data-en');
  });
  const map={'en':'English','pt':'Português','es':'Español','fr':'Français'};
  document.querySelectorAll('.lang-btn').forEach(btn=>{
    btn.classList.toggle('active',btn.textContent===map[lang]);
  });
}
</script>
</body>
</html>`;

const GUIDE_CEDOFEITA4_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Porto Haven — Cedofeita 4º · Guest Guide</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0;color:#1a1a1a;min-height:100vh}
.hero{background:#1a1a1a;color:#fff;padding:2rem 1.25rem 1.5rem}
.hero-tag{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:6px}
.hero-title{font-size:26px;font-weight:600;margin-bottom:4px}
.hero-sub{font-size:14px;color:#aaa;margin-bottom:1.25rem}
.lang-toggle{display:flex;gap:8px}
.lang-btn{padding:6px 16px;border-radius:20px;border:1px solid #444;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s}
.lang-btn.active{background:#fff;color:#1a1a1a;border-color:#fff}
.hero-map{display:inline-flex;align-items:center;gap:6px;margin-top:1rem;color:#ccc;font-size:13px;text-decoration:none;border-bottom:1px solid #444;padding-bottom:2px}
.container{max-width:600px;margin:0 auto;padding:1rem}
.section{background:#fff;border-radius:12px;margin-bottom:0.75rem;overflow:hidden;border:1px solid #ece9e3}
.section-header{display:flex;align-items:center;gap:10px;padding:1rem 1.25rem;cursor:pointer;user-select:none}
.section-icon{width:32px;height:32px;border-radius:8px;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-title{font-size:15px;font-weight:600;flex:1;color:#1a1a1a}
.section-chevron{font-size:18px;color:#999;transition:transform 0.25s}
.section-body{padding:0 1.25rem 1.25rem;display:none}
.section-body.open{display:block}
.section-header.open .section-chevron{transform:rotate(180deg)}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0.75rem}
.info-card{background:#f7f5f0;border-radius:8px;padding:0.75rem}
.info-card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.info-card-value{font-size:15px;font-weight:600;color:#1a1a1a}
.wifi-box{background:#1a1a1a;color:#fff;border-radius:10px;padding:1rem 1.25rem;margin-bottom:8px}
.wifi-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.wifi-value{font-size:16px;font-weight:600;font-family:monospace;letter-spacing:0.05em}
.place{padding:10px 0;border-bottom:1px solid #f0ede8}
.place:last-child{border-bottom:none}
.place-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}
.place-name{font-size:14px;font-weight:600;color:#1a1a1a}
.place-rating{font-size:12px;color:#f59e0b;font-weight:600;white-space:nowrap}
.place-desc{font-size:12px;color:#666;line-height:1.4;margin-bottom:5px}
.place-meta{font-size:11px;color:#999;margin-bottom:5px}
.map-link{font-size:12px;color:#2563eb;text-decoration:none;display:inline-flex;align-items:center;gap:3px}
.badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:10px;margin-left:5px;font-weight:500}
.badge-reserve{background:#ede9fe;color:#5b21b6}
.rule{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0ede8;font-size:14px}
.rule:last-child{border-bottom:none}
.rule-icon{font-size:16px;width:24px;text-align:center}
.tip{font-size:13px;color:#555;line-height:1.5;padding:8px 0}
.service-item{padding:10px 0;border-bottom:1px solid #f0ede8}
.service-item:last-child{border-bottom:none}
.service-name{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
.service-desc{font-size:12px;color:#666;margin-bottom:5px}
.divider{height:1px;background:#f0ede8;margin:10px 0}
.footer{text-align:center;padding:2rem 1rem;color:#999;font-size:12px}
.emergency-box{background:#fff1f1;border:1px solid #fecaca;border-radius:10px;padding:1rem 1.25rem}
.emergency-title{font-size:13px;font-weight:600;color:#991b1b;margin-bottom:8px}
.emergency-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #fecaca}
.emergency-row:last-child{border-bottom:none}
.emergency-label{color:#666}
.emergency-num{font-weight:600;color:#1a1a1a}
</style>
</head>
<body>

<div class="hero">
  <div class="hero-tag">Porto Haven</div>
  <div class="hero-title">Porto Haven — Cedofeita</div>
  <div class="hero-sub">Rua de Cedofeita, 213 · 4º andar · Porto</div>
  <div class="lang-toggle">
    <button class="lang-btn active" onclick="setLang('en')">English</button>
    <button class="lang-btn" onclick="setLang('pt')">Português</button>
    <button class="lang-btn" onclick="setLang('es')">Español</button>
    <button class="lang-btn" onclick="setLang('fr')">Français</button>
  </div>
  <a href="https://maps.google.com/?q=Rua+de+Cedofeita+213+Porto" target="_blank" class="hero-map">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
</div>

<div class="container">

  <div class="section">
    <div class="section-header open" onclick="toggle(this)">
      <div class="section-icon">🔑</div>
      <div class="section-title" data-en="Check-in & check-out" data-pt="Check-in & check-out" data-es="Check-in & check-out" data-fr="Check-in & check-out">Check-in & check-out</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body open">
      <div class="info-grid">
        <div class="info-card"><div class="info-card-label" data-en="Check-in" data-pt="Check-in" data-es="Check-in" data-fr="Check-in">Check-in</div><div class="info-card-value">16:00 – 00:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Check-out" data-pt="Check-out" data-es="Check-out" data-fr="Check-out">Check-out</div><div class="info-card-value" data-en="by 11:00" data-pt="até às 11:00" data-es="antes de las 11:00" data-fr="avant 11h00">by 11:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (arrival)" data-pt="Deixar malas (chegada)" data-es="Dejar maletas (llegada)" data-fr="Déposer bagages (arrivée)">Drop bags (arrival)</div><div class="info-card-value" data-en="from 12:00" data-pt="a partir das 12:00" data-es="desde las 12:00" data-fr="à partir de 12h00">from 12:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (departure)" data-pt="Deixar malas (saída)" data-es="Dejar maletas (salida)" data-fr="Déposer bagages (départ)">Drop bags (departure)</div><div class="info-card-value" data-en="until 13:00" data-pt="até às 13:00" data-es="hasta las 13:00" data-fr="jusqu'à 13h00">until 13:00</div></div>
      </div>
      <p class="tip" data-en="Self check-in. Your access code is sent 48 hours before arrival. The building has a lift.</p>
      <p class="tip" data-en="Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum." data-pt="Infelizmente não conseguimos garantir early check-in ou late check-out pois normalmente estamos completamente reservados, mas podes deixar as malas no apartamento a partir das 12:00 no dia de chegada, ou deixar as malas no apartamento no dia de saída até às 13:00 no máximo." data-es="Lamentablemente no podemos ofrecer early check-in ni late check-out ya que normalmente estamos completos, pero puedes dejar tus maletas dentro del apartamento a partir de las 12:00 del día de llegada, o dejar tus maletas en el apartamento el día de salida hasta las 13:00 como máximo." data-fr="Malheureusement, nous ne pouvons pas proposer un check-in anticipé ou un check-out tardif car nous sommes généralement complets, mais vous pouvez déposer vos bagages dans l'appartement à partir de 12h00 le jour d'arrivée, ou laisser vos bagages dans l'appartement le jour du départ jusqu'à 13h00 maximum.">Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📶</div>
      <div class="section-title">Wi-Fi</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="wifi-box">
        <div class="wifi-label" data-en="Network" data-pt="Rede" data-es="Red" data-fr="Réseau">Network</div>
        <div class="wifi-value">Abacatur 4</div>
      </div>
      <div class="wifi-box">
        <div class="wifi-label">Password</div>
        <div class="wifi-value">@PHabacatur4_</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🍽️</div>
      <div class="section-title" data-en="Restaurants & cafés" data-pt="Restaurantes & cafés" data-es="Restaurantes & cafés" data-fr="Restaurants & cafés">Restaurants & cafés</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-header"><div class="place-name">1858 BBGourmet Criativo</div><div class="place-rating">⭐ fine dining</div></div>
        <div class="place-desc" data-en="Creative fine dining, one of the best restaurants in Porto. Right on your street." data-pt="Fine dining criativo, um dos melhores restaurantes do Porto. Mesmo na tua rua.">Creative fine dining, one of the best restaurants in Porto. Right on your street.</div>
        <div class="place-meta" data-en="Daily 12:00–22:30 (Fri–Sat until 23:00)" data-pt="Diário 12h–22h30 (Sex–Sáb até 23h)">Daily 12:00–22:30 (Fri–Sat until 23:00)</div>
        <a href="https://maps.google.com/?q=1858+BBGourmet+Criativo+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Capim Dourado</div><div class="place-rating">⭐ Brazilian</div></div>
        <div class="place-desc" data-en="Excellent Brazilian cuisine with a Porto twist. Lively atmosphere, great flavours." data-pt="Excelente cozinha brasileira com toque portuense. Ambiente animado, sabores ótimos.">Excellent Brazilian cuisine with a Porto twist. Lively atmosphere, great flavours.</div>
        <div class="place-meta" data-en="Mon–Thu 19:30–23:00 · Fri–Sat 19:30–00:00 · Sun 12:30–16:00 & 19:30–23:00" data-pt="Seg–Qui 19h30–23h · Sex–Sáb 19h30–00h · Dom 12h30–16h & 19h30–23h">Mon–Thu 19:30–23:00 · Fri–Sat 19:30–00:00 · Sun 12:30–16:00 & 19:30–23:00</div>
        <a href="https://maps.google.com/?q=Capim+Dourado+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Restaurante Rittos</div><div class="place-rating">⭐ Portuguese</div></div>
        <div class="place-desc" data-en="Classic Portuguese tavern, great value. A neighbourhood staple." data-pt="Taberna portuguesa clássica, excelente relação qualidade-preço. Um clássico do bairro.">Classic Portuguese tavern, great value. A neighbourhood staple.</div>
        <div class="place-meta" data-en="Mon–Fri 9:00–18:00 · Sat 9:00–17:00" data-pt="Seg–Sex 9h–18h · Sáb 9h–17h">Mon–Fri 9:00–18:00 · Sat 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Restaurante+Rittos+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">LM Art Kitchen</div><div class="place-rating">⭐ garden terrace</div></div>
        <div class="place-desc" data-en="Lovely garden terrace, great for brunch and lunch. Creative menu in a relaxed setting." data-pt="Linda esplanada com jardim, ótimo para brunch e almoço. Menu criativo em ambiente descontraído.">Lovely garden terrace, great for brunch and lunch. Creative menu in a relaxed setting.</div>
        <div class="place-meta" data-en="Weekdays 10:00–18:00 · Weekends 9:00–19:00" data-pt="Dias de semana 10h–18h · Fins de semana 9h–19h">Weekdays 10:00–18:00 · Weekends 9:00–19:00</div>
        <a href="https://maps.google.com/?q=LM+Art+Kitchen+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Cafés & brunch" data-pt="Cafés & brunch" data-es="Cafés & brunch" data-fr="Cafés & brunch">Cafés & brunch</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Comum</div><div class="place-rating">⭐ specialty coffee</div></div>
        <div class="place-desc" data-en="Specialty coffee, shakshuka and a sunny courtyard. A Cedofeita favourite." data-pt="Café de especialidade, shakshuka e pátio ensolarado. Um favorito de Cedofeita.">Specialty coffee, shakshuka and a sunny courtyard. A Cedofeita favourite.</div>
        <div class="place-meta" data-en="Daily 9:00–17:00" data-pt="Diário 9h–17h">Daily 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Comum+cafe+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">BEIJI café & pâtisserie</div><div class="place-rating">⭐ pastries</div></div>
        <div class="place-desc" data-en="Cosy and charming with beautiful pastries. A lovely spot for breakfast." data-pt="Acolhedor e encantador com pastéis deliciosos. Ótimo para o pequeno-almoço.">Cosy and charming with beautiful pastries. A lovely spot for breakfast.</div>
        <div class="place-meta" data-en="Tue–Sun 9:00–18:00" data-pt="Ter–Dom 9h–18h">Tue–Sun 9:00–18:00</div>
        <a href="https://maps.google.com/?q=BEIJI+cafe+patisserie+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Apartamento Coffee & Snacks</div><div class="place-rating">⭐ pancakes</div></div>
        <div class="place-desc" data-en="Fluffy pancakes and great latte art. Perfect for a lazy morning." data-pt="Panquecas fofas e latte art incrível. Perfeito para uma manhã preguiçosa.">Fluffy pancakes and great latte art. Perfect for a lazy morning.</div>
        <div class="place-meta" data-en="Mon, Sat & Sun 9:00–17:00" data-pt="Seg, Sáb & Dom 9h–17h">Mon, Sat & Sun 9:00–17:00</div>
        <a href="https://maps.google.com/?q=Apartamento+Coffee+Snacks+Rua+Cedofeita+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Rooftop bars" data-pt="Rooftop bars" data-es="Bares en azotea" data-fr="Bars en terrasse">Rooftop bars</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Terraço do Jardim</div><div class="place-rating">⭐ 4.4 · city views</div></div>
        <div class="place-desc" data-en="Rooftop lounge with stunning city views, great cocktails and a warm atmosphere." data-pt="Rooftop com vistas deslumbrantes da cidade, cocktails e ambiente acolhedor.">Rooftop lounge with stunning city views, great cocktails and a warm atmosphere.</div>
        <div class="place-meta" data-en="Daily 11:00–00:00" data-pt="Diário 11h–00h">Daily 11:00–00:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJh1ZsQQBlJA0RNY_5IS7Ix58" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Amura Bar & Rooftop</div><div class="place-rating">⭐ 4.5 · river views</div></div>
        <div class="place-desc" data-en="Beautiful rooftop overlooking the Douro river. Great atmosphere and friendly service." data-pt="Rooftop com vistas para o Douro. Excelente ambiente e serviço simpático.">Beautiful rooftop overlooking the Douro river. Great atmosphere and friendly service.</div>
        <div class="place-meta" data-en="Daily 11:00–23:30" data-pt="Diário 11h–23h30">Daily 11:00–23:30</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ31kEd4FlJA0R6My2TrmhC6o" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🛒</div>
      <div class="section-title" data-en="Supermarkets" data-pt="Supermercados" data-es="Supermercados" data-fr="Supermarchés">Supermarkets</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">SPAR Cedofeita</div>
        <div class="place-desc" data-en="Right next door at nº 230! Mon–Sat 10:00–21:30." data-pt="Mesmo ao lado, no nº 230! Seg–Sáb 10h–21h30.">Right next door at nº 230! Mon–Sat 10:00–21:30.</div>
        <a href="https://maps.google.com/?q=SPAR+Rua+Cedofeita+230+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name">Pingo Doce</div>
        <div class="place-desc" data-en="Full supermarket at nº 435, great for a proper shop. Daily 8:00–21:00." data-pt="Supermercado completo no nº 435, ótimo para fazer compras. Diário 8h–21h.">Full supermarket at nº 435, great for a proper shop. Daily 8:00–21:00.</div>
        <a href="https://maps.google.com/?q=Pingo+Doce+Rua+Cedofeita+435+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name">My Auchan</div>
        <div class="place-desc" data-en="At nº 80, open daily 8:00–21:00." data-pt="No nº 80, aberto todos os dias 8h–21h.">At nº 80, open daily 8:00–21:00.</div>
        <a href="https://maps.google.com/?q=Auchan+Rua+Cedofeita+80+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🚇</div>
      <div class="section-title" data-en="Getting around" data-pt="Transportes" data-es="Cómo moverse" data-fr="Se déplacer">Getting around</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name" data-en="Metro — Lapa (Yellow Line)" data-pt="Metro — Lapa (Linha Amarela)" data-es="Metro — Lapa (Línea Amarilla)" data-fr="Métro — Lapa (Ligne Jaune)">Metro — Lapa (Yellow Line)</div>
        <div class="service-desc" data-en="~5 min walk. Connects to Trindade (city centre hub) and Casa da Música." data-pt="~5 min a pé. Liga ao Trindade (centro) e à Casa da Música.">~5 min walk. Connects to Trindade (city centre hub) and Casa da Música.</div>
        <a href="https://maps.google.com/?q=Metro+Lapa+Porto" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Taxi / Rideshare" data-pt="Taxi / Rideshare" data-es="Taxi / Transporte privado" data-fr="Taxi / VTC">Taxi / Rideshare</div>
        <div class="service-desc" data-en="Taxi rank at Praça do Marquês (~10 min walk). Also available: Uber, Bolt, Free Now." data-pt="Praça de taxis no Marquês (~10 min a pé). Também disponível: Uber, Bolt, Free Now.">Taxi rank at Praça do Marquês (~10 min walk). Also available: Uber, Bolt, Free Now.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJX8i6JlhkJA0RKTZK8UjKbAU" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Airport transfer" data-pt="Transfer aeroporto" data-es="Traslado al aeropuerto" data-fr="Transfert aéroport">Airport transfer</div>
        <div class="service-desc" data-en="Book a direct ride to/from the apartment." data-pt="Reserva uma viagem direta de/para o apartamento.">Book a direct ride to/from the apartment.</div>
        <a href="https://welc.io/ps/RGpgPROV" target="_blank" class="map-link">🚗 <span data-en="Book transfer" data-pt="Reservar transfer" data-es="Reservar traslado" data-fr="Réserver un transfert">Book transfer</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🅿️</div>
      <div class="section-title" data-en="Parking" data-pt="Estacionamento" data-es="Aparcamiento" data-fr="Stationnement">Parking</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Luis Vaz Medeiros</div>
        <div class="place-desc" data-en="Rua de Cedofeita 457 · ~€10/day · Mon–Sat 8:00–21:00 (closed Sundays)." data-pt="Rua de Cedofeita 457 · ~€10/dia · Seg–Sáb 8h–21h (fechado domingos).">Rua de Cedofeita 457 · ~€10/day · Mon–Sat 8:00–21:00 (closed Sundays).</div>
      </div>
      <div class="place">
        <div class="place-name">Parking Recolhas</div>
        <div class="place-desc" data-en="Rua de Cedofeita 538 · ~€15/24h · Open 24 hours (confirm arrival with staff)." data-pt="Rua de Cedofeita 538 · ~€15/24h · Aberto 24h (confirma chegada com a equipa).">Rua de Cedofeita 538 · ~€15/24h · Open 24 hours (confirm arrival with staff).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🏪</div>
      <div class="section-title" data-en="Useful services nearby" data-pt="Serviços úteis perto" data-es="Servicios útiles cerca" data-fr="Services utiles à proximité">Useful services nearby</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Pharmacy" data-pt="Farmácia" data-es="Farmacia" data-fr="Pharmacie">Pharmacy</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Farmácia Figueiredo</div><div class="place-rating">⭐ 4.2</div></div>
        <div class="place-desc" data-en="Helpful and knowledgeable staff. Right on your street at nº 132." data-pt="Equipa prestável e conhecedora. Mesmo na tua rua, no nº 132.">Helpful and knowledgeable staff. Right on your street at nº 132.</div>
        <div class="place-meta" data-en="Mon–Fri 9:00–20:00 · Sat 9:00–13:00" data-pt="Seg–Sex 9h–20h · Sáb 9h–13h">Mon–Fri 9:00–20:00 · Sat 9:00–13:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJG9VsowJlJA0RGV1vss5sxdI" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Hair salon / Barber" data-pt="Cabeleireiro / Barbearia" data-es="Peluquería / Barbería" data-fr="Salon de coiffure / Barbier">Hair salon / Barber</p>
      <div class="place">
        <div class="place-header"><div class="place-name">TGS Barber</div><div class="place-rating">⭐ 4.9 · 93 reviews</div></div>
        <div class="place-desc" data-en="Excellent barber on your street at nº 561. Speaks English, very reasonable prices." data-pt="Excelente barbearia na tua rua, no nº 561. Fala inglês, preços muito razoáveis.">Excellent barber on your street at nº 561. Speaks English, very reasonable prices.</div>
        <div class="place-meta" data-en="Mon–Sat 9:00–21:00 · Sun 11:00–21:00" data-pt="Seg–Sáb 9h–21h · Dom 11h–21h">Mon–Sat 9:00–21:00 · Sun 11:00–21:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ1fDh5otlJA0RGmZIAdTatUY" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">GS Beauty Salon</div><div class="place-rating">⭐ 4.8 · hair & nails</div></div>
        <div class="place-desc" data-en="Hair colour, cuts and nail extensions. Professional and friendly. At nº 170." data-pt="Coloração, cortes e extensões de unhas. Profissional e simpático. No nº 170.">Hair colour, cuts and nail extensions. Professional and friendly. At nº 170.</div>
        <div class="place-meta" data-en="Daily 10:00–20:00" data-pt="Diário 10h–20h">Daily 10:00–20:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJc5H3qzdlJA0R_3bJ1fhNmSs" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Laundry" data-pt="Lavandaria" data-es="Lavandería" data-fr="Laverie">Laundry</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Conforto Limpeza</div><div class="place-rating">⭐ 4.7 · 117 reviews</div></div>
        <div class="place-desc" data-en="Drop-off and self-service. Wash, dry and fold available. Detergent included. Open daily 7:00–23:00." data-pt="Entrega e self-service. Lavar, secar e dobrar disponível. Detergente incluído. Diário 7h–23h.">Drop-off and self-service. Wash, dry and fold available. Detergent included. Open daily 7:00–23:00.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJpRUGl0RlJA0RM-AXxGD0oz4" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="ATM / Cash" data-pt="Multibanco" data-es="Cajero / Efectivo" data-fr="Distributeur / Espèces">ATM / Cash</p>
      <div class="place">
        <div class="place-name" data-en="Multibanco — Rua de Cedofeita" data-pt="Multibanco — Rua de Cedofeita" data-es="Cajero — Rua de Cedofeita" data-fr="Distributeur — Rua de Cedofeita">Multibanco — Rua de Cedofeita</div>
        <div class="place-desc" data-en="Use Multibanco (MB) machines — avoid Euronet ATMs on the street (very high fees)." data-pt="Usa máquinas Multibanco (MB) — evita os Euronet na rua (taxas muito altas).">Use Multibanco (MB) machines — avoid Euronet ATMs on the street (very high fees).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🧳</div>
      <div class="section-title" data-en="Luggage storage" data-pt="Guarda-bagagem" data-es="Consigna de equipaje" data-fr="Consigne à bagages">Luggage storage</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name">Bounce</div>
        <div class="service-desc" data-en="Storage locations nearby from €1/day. 5% discount with our link." data-pt="Locais de armazenamento perto, a partir de €1/dia. 5% de desconto com o nosso link.">Storage locations nearby from €1/day. 5% discount with our link.</div>
        <a href="https://go.bounce.com/PORTOHAVEN7471817336" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
      <div class="service-item">
        <div class="service-name">LUGGit</div>
        <div class="service-desc" data-en="Collects and delivers your bags wherever and whenever you want. 10% discount for our guests." data-pt="Recolhe e entrega a tua bagagem onde e quando quiseres. 10% de desconto para os nossos hóspedes.">Collects and delivers your bags wherever and whenever you want. 10% discount for our guests.</div>
        <a href="https://luggit.app/partner/porto-haven" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🗺️</div>
      <div class="section-title" data-en="Things to do" data-pt="O que visitar" data-es="Qué hacer" data-fr="À faire">Things to do</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Casa da Música</div>
        <div class="place-desc" data-en="Iconic concert hall, one of Porto's most striking buildings. Check the programme online." data-pt="Sala de concertos icónica, um dos edifícios mais marcantes do Porto. Consulta a programação online.">Iconic concert hall, one of Porto's most striking buildings. Check the programme online.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="São Bento Station" data-pt="Estação de São Bento" data-es="Estación de São Bento" data-fr="Gare de São Bento">São Bento Station</div>
        <div class="place-desc" data-en="Stunning azulejo tile panels. Free to enter — don't miss it." data-pt="Painéis de azulejos impressionantes. Entrada gratuita — não percas.">Stunning azulejo tile panels. Free to enter — don't miss it.</div>
      </div>
      <div class="place">
        <div class="place-name">Livraria Lello</div>
        <div class="place-desc" data-en="One of the world's most beautiful bookshops. Book tickets online to avoid queues." data-pt="Uma das livrarias mais bonitas do mundo. Compra bilhetes online para evitar filas.">One of the world's most beautiful bookshops. Book tickets online to avoid queues.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Ribeira & D. Luís Bridge" data-pt="Ribeira & Ponte D. Luís" data-es="Ribeira & Puente D. Luís" data-fr="Ribeira & Pont D. Luís">Ribeira & D. Luís Bridge</div>
        <div class="place-desc" data-en="Walk the riverside and cross to Gaia for Port wine cellars and stunning views." data-pt="Passeio junto ao rio e atravessa até Gaia para as caves de vinho do Porto e vistas deslumbrantes.">Walk the riverside and cross to Gaia for Port wine cellars and stunning views.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Rua das Flores & Avenida dos Aliados" data-pt="Rua das Flores & Avenida dos Aliados" data-es="Rua das Flores & Avenida dos Aliados" data-fr="Rua das Flores & Avenida dos Aliados">Rua das Flores & Avenida dos Aliados</div>
        <div class="place-desc" data-en="Beautiful pedestrian street and Porto's grand boulevard — both within walking distance." data-pt="Bela rua pedonal e a grande avenida do Porto — ambas a curta distância a pé.">Beautiful pedestrian street and Porto's grand boulevard — both within walking distance.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Torre dos Clérigos" data-pt="Torre dos Clérigos" data-es="Torre dos Clérigos" data-fr="Tour dos Clérigos">Torre dos Clérigos</div>
        <div class="place-desc" data-en="Iconic baroque tower with 360° panoramic views of Porto. Worth the climb." data-pt="Torre barroca icónica com vistas panorâmicas 360°. Vale bem a subida.">Iconic baroque tower with 360° panoramic views of Porto. Worth the climb.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Foz do Douro" data-pt="Foz do Douro" data-es="Foz do Douro" data-fr="Foz do Douro">Foz do Douro</div>
        <div class="place-desc" data-en="Where the Douro meets the Atlantic. Walk along Avenida Brasil and stop at Docemar for amazing croissants." data-pt="Onde o Douro encontra o Atlântico. Passeio pela Avenida Brasil e para no Docemar para croissants incríveis.">Where the Douro meets the Atlantic. Walk along Avenida Brasil and stop at Docemar for amazing croissants.</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📋</div>
      <div class="section-title" data-en="House rules" data-pt="Regras da casa" data-es="Normas de la casa" data-fr="Règles de la maison">House rules</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="rule"><div class="rule-icon">🚭</div><span data-en="No smoking" data-pt="Proibido fumar" data-es="Prohibido fumar" data-fr="Défense de fumer">No smoking</span></div>
      <div class="rule"><div class="rule-icon">🎉</div><span data-en="No parties or events" data-pt="Sem festas ou eventos" data-es="Sin fiestas ni eventos" data-fr="Pas de fêtes ni d'événements">No parties or events</span></div>
      <div class="rule"><div class="rule-icon">🐾</div><span data-en="No pets" data-pt="Sem animais" data-es="No se admiten mascotas" data-fr="Animaux interdits">No pets</span></div>
      <div class="rule"><div class="rule-icon">🚫</div><span data-en="No external visitors" data-pt="Sem visitas externas" data-es="Sin visitas externas" data-fr="Pas de visiteurs extérieurs">No external visitors</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🆘</div>
      <div class="section-title" data-en="Emergency contacts" data-pt="Contactos de emergência" data-es="Contactos de emergencia" data-fr="Contacts d'urgence">Emergency contacts</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="emergency-box">
        <div class="emergency-title" data-en="Emergency numbers" data-pt="Números de emergência" data-es="Números de emergencia" data-fr="Numéros d'urgence">Emergency numbers</div>
        <div class="emergency-row"><span class="emergency-label" data-en="Emergency (EU)" data-pt="Emergência (EU)" data-es="Emergencias (UE)" data-fr="Urgences (UE)">Emergency (EU)</span><span class="emergency-num">112</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Police (PSP)" data-pt="Polícia (PSP)" data-es="Policía (PSP)" data-fr="Police (PSP)">Police (PSP)</span><span class="emergency-num">222 092 000</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Hospital St António" data-pt="Hospital St António" data-es="Hospital St António" data-fr="Hôpital St António">Hospital St António</span><span class="emergency-num">222 077 500</span></div>
      </div>
      <p class="tip" style="margin-top:0.75rem" data-en="For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible." data-pt="Para qualquer problema com o apartamento, envia-nos uma mensagem pela plataforma de reserva e responderemos o mais brevemente possível." data-es="Para cualquier problema con el apartamento, envíanos un mensaje a través de tu plataforma de reserva y te responderemos lo antes posible." data-fr="Pour tout problème avec l'appartement, envoyez-nous un message via votre plateforme de réservation et nous vous répondrons dès que possible.">For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible.</p>
    </div>
  </div>

</div>

<div class="footer">
  <p data-en="Porto Haven · Cedofeita · We hope you have a wonderful stay!" data-pt="Porto Haven · Cedofeita · Esperamos que tenhas uma estadia maravilhosa!">Porto Haven · Cedofeita 101 · We hope you have a wonderful stay!</p>
</div>

<script>
function toggle(header){
  const body=header.nextElementSibling;
  const open=body.classList.contains('open');
  body.classList.toggle('open',!open);
  header.classList.toggle('open',!open);
}
function setLang(lang){
  document.querySelectorAll('[data-en]').forEach(el=>{
    el.textContent=el.getAttribute('data-'+lang)||el.getAttribute('data-en');
  });
  const map={'en':'English','pt':'Português','es':'Español','fr':'Français'};
  document.querySelectorAll('.lang-btn').forEach(btn=>{
    btn.classList.toggle('active',btn.textContent===map[lang]);
  });
}
</script>
</body>
</html>`;


const GUIDE_ALEGRIA700_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Alegria 700 — Guest Guide</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0;color:#1a1a1a}
.hero{background:#1a1a1a;color:#fff;padding:2rem 1.25rem 1.5rem}
.hero-tag{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:6px}
.hero-title{font-size:26px;font-weight:600;margin-bottom:4px}
.hero-sub{font-size:14px;color:#aaa;margin-bottom:1.25rem}
.lang-toggle{display:flex;gap:8px;flex-wrap:wrap}
.lang-btn{padding:6px 16px;border-radius:20px;border:1px solid #444;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s}
.lang-btn.active{background:#fff;color:#1a1a1a;border-color:#fff}
.hero-map{display:inline-flex;align-items:center;gap:6px;margin-top:1rem;color:#ccc;font-size:13px;text-decoration:none;border-bottom:1px solid #444;padding-bottom:2px}
.container{max-width:600px;margin:0 auto;padding:1rem}
.section{background:#fff;border-radius:12px;margin-bottom:0.75rem;overflow:hidden;border:1px solid #ece9e3}
.section-header{display:flex;align-items:center;gap:10px;padding:1rem 1.25rem;cursor:pointer;user-select:none}
.section-icon{width:32px;height:32px;border-radius:8px;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-title{font-size:15px;font-weight:600;flex:1;color:#1a1a1a}
.section-chevron{font-size:18px;color:#999;transition:transform 0.25s}
.section-body{padding:0 1.25rem 1.25rem;display:none}
.section-body.open{display:block}
.section-header.open .section-chevron{transform:rotate(180deg)}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0.75rem}
.info-card{background:#f7f5f0;border-radius:8px;padding:0.75rem}
.info-card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.info-card-value{font-size:15px;font-weight:600;color:#1a1a1a}
.wifi-box{background:#1a1a1a;color:#fff;border-radius:10px;padding:1rem 1.25rem;margin-bottom:8px}
.wifi-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.wifi-value{font-size:16px;font-weight:600;font-family:monospace;letter-spacing:0.05em}
.place{padding:10px 0;border-bottom:1px solid #f0ede8}
.place:last-child{border-bottom:none}
.place-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}
.place-name{font-size:14px;font-weight:600;color:#1a1a1a}
.place-rating{font-size:12px;color:#f59e0b;font-weight:600;white-space:nowrap}
.place-desc{font-size:12px;color:#666;line-height:1.4;margin-bottom:5px}
.place-meta{font-size:11px;color:#999;margin-bottom:5px}
.map-link{font-size:12px;color:#2563eb;text-decoration:none;display:inline-flex;align-items:center;gap:3px}
.badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:10px;margin-left:5px;font-weight:500}
.badge-cash{background:#fef3c7;color:#92400e}
.badge-reserve{background:#ede9fe;color:#5b21b6}
.rule{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0ede8;font-size:14px}
.rule:last-child{border-bottom:none}
.rule-icon{font-size:16px;width:24px;text-align:center}
.tip{font-size:13px;color:#555;line-height:1.5;padding:8px 0}
.service-item{padding:10px 0;border-bottom:1px solid #f0ede8}
.service-item:last-child{border-bottom:none}
.service-name{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
.service-desc{font-size:12px;color:#666;margin-bottom:5px}
.divider{height:1px;background:#f0ede8;margin:10px 0}
.footer{text-align:center;padding:2rem 1rem;color:#999;font-size:12px}
.emergency-box{background:#fff1f1;border:1px solid #fecaca;border-radius:10px;padding:1rem 1.25rem}
.emergency-title{font-size:13px;font-weight:600;color:#991b1b;margin-bottom:8px}
.emergency-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #fecaca}
.emergency-row:last-child{border-bottom:none}
.emergency-label{color:#666}
.emergency-num{font-weight:600;color:#1a1a1a}
.notice{background:#fff8e6;border:1px solid #f0d080;border-radius:8px;padding:0.75rem 1rem;margin-top:0.75rem;display:flex;gap:8px;align-items:flex-start}
.notice span{font-size:16px;flex-shrink:0}
.notice p{font-size:13px;color:#7a5c00;line-height:1.5}
</style>
</head>
<body>
<div class="hero">
  <div class="hero-tag">Porto Haven</div>
  <div class="hero-title">Alegria 700</div>
  <div class="hero-sub" data-en="Rua da Alegria, 700 · 3rd floor left · Porto" data-pt="Rua da Alegria, 700 · 3º andar esquerdo · Porto" data-es="Rua da Alegria, 700 · 3er piso izquierda · Oporto" data-fr="Rua da Alegria, 700 · 3e étage gauche · Porto">Rua da Alegria, 700 · 3rd floor left · Porto</div>
  <div class="lang-toggle">
    <button class="lang-btn active" onclick="setLang('en')">English</button>
    <button class="lang-btn" onclick="setLang('pt')">Português</button>
    <button class="lang-btn" onclick="setLang('es')">Español</button>
    <button class="lang-btn" onclick="setLang('fr')">Français</button>
  </div>
  <a href="https://maps.app.goo.gl/tFbB65uFjz1iRFhZ8" target="_blank" class="hero-map">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
</div>
<div class="container">

  <div class="section">
    <div class="section-header open" onclick="toggle(this)">
      <div class="section-icon">🔑</div>
      <div class="section-title" data-en="Check-in & check-out" data-pt="Check-in & check-out" data-es="Check-in & check-out" data-fr="Check-in & check-out">Check-in & check-out</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body open">
      <div class="info-grid">
        <div class="info-card"><div class="info-card-label" data-en="Check-in" data-pt="Check-in" data-es="Check-in" data-fr="Check-in">Check-in</div><div class="info-card-value">16:00 – 00:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Check-out" data-pt="Check-out" data-es="Check-out" data-fr="Check-out">Check-out</div><div class="info-card-value" data-en="by 11:00" data-pt="até às 11:00" data-es="antes de las 11:00" data-fr="avant 11h00">by 11:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (arrival)" data-pt="Deixar malas (chegada)" data-es="Dejar maletas (llegada)" data-fr="Déposer bagages (arrivée)">Drop bags (arrival)</div><div class="info-card-value" data-en="from 12:00" data-pt="a partir das 12:00" data-es="desde las 12:00" data-fr="à partir de 12h00">from 12:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (departure)" data-pt="Deixar malas (saída)" data-es="Dejar maletas (salida)" data-fr="Déposer bagages (départ)">Drop bags (departure)</div><div class="info-card-value" data-en="until 13:00" data-pt="até às 13:00" data-es="hasta las 13:00" data-fr="jusqu'à 13h00">until 13:00</div></div>
      </div>
      <p class="tip" data-en="Self check-in with key box. Your access code is sent 48 hours before arrival. The building has a lift." data-pt="Self check-in com cofre. O código de acesso é enviado 48h antes. O prédio tem elevador." data-es="Self check-in con caja de llaves. Tu código se envía 48h antes. El edificio tiene ascensor." data-fr="Self check-in avec boîte à clés. Votre code est envoyé 48h avant. L'immeuble a un ascenseur.">Self check-in with key box. Your access code is sent 48 hours before arrival. The building has a lift.</p>
      <p class="tip" data-en="Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum." data-pt="Infelizmente não conseguimos garantir early check-in ou late check-out pois normalmente estamos completamente reservados, mas podes deixar as malas no apartamento a partir das 12:00 no dia de chegada, ou deixar as malas no apartamento no dia de saída até às 13:00 no máximo." data-es="Lamentablemente no podemos ofrecer early check-in ni late check-out ya que normalmente estamos completos, pero puedes dejar tus maletas desde las 12:00 el día de llegada o hasta las 13:00 el día de salida." data-fr="Malheureusement, nous ne pouvons pas proposer de check-in anticipé ni de check-out tardif, mais vous pouvez déposer vos bagages à partir de 12h00 le jour d'arrivée ou les laisser jusqu'à 13h00 le jour du départ.">Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📶</div>
      <div class="section-title">Wi-Fi</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="wifi-box"><div class="wifi-label" data-en="Network" data-pt="Rede" data-es="Red" data-fr="Réseau">Network</div><div class="wifi-value">Vodafone-ACFA3C</div></div>
      <div class="wifi-box"><div class="wifi-label">Password</div><div class="wifi-value">Alegria7003e</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🍽️</div>
      <div class="section-title" data-en="Restaurants & cafés" data-pt="Restaurantes & cafés" data-es="Restaurantes & cafés" data-fr="Restaurants & cafés">Restaurants & cafés</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-header"><div class="place-name">Solar da Alegria</div><div class="place-rating">⭐ 4.4 · steps away</div></div>
        <div class="place-desc" data-en="Right next door at nº 712! Authentic Portuguese steaks and fresh fish, cosy atmosphere. A neighbourhood classic." data-pt="Mesmo ao lado no nº 712! Bifes e peixe fresco, ambiente aconchegante. Um clássico do bairro." data-es="¡Justo al lado en el nº 712! Bistecs y pescado fresco, ambiente acogedor. Un clásico del barrio." data-fr="Juste à côté au nº 712 ! Biftecks et poisson frais, ambiance chaleureuse. Un classique du quartier.">Right next door at nº 712! Authentic Portuguese steaks and fresh fish, cosy atmosphere. A neighbourhood classic.</div>
        <div class="place-meta" data-en="Mon–Sat 12:00–15:00 & 18:30–22:00" data-pt="Seg–Sáb 12h–15h e 18h30–22h" data-es="Lun–Sáb 12:00–15:00 y 18:30–22:00" data-fr="Lun–Sam 12h–15h et 18h30–22h">Mon–Sat 12:00–15:00 & 18:30–22:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJp2jXV_ZkJA0RJRCdIFc8ea8" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Francesinha Café <span class="badge badge-reserve" data-en="book ahead" data-pt="reserva" data-es="reserva" data-fr="réserver">book ahead</span></div><div class="place-rating">⭐ 4.5 · 2k reviews</div></div>
        <div class="place-desc" data-en="A 5-min walk up your street at nº 946. Consistently rated one of Porto's best francesinhas." data-pt="A 5 min a pé na tua rua, no nº 946. Consistentemente uma das melhores francesinhas do Porto." data-es="A 5 min caminando en tu calle, nº 946. Una de las mejores francesinhas de Oporto." data-fr="À 5 min à pied, nº 946. Constamment considéré comme l'une des meilleures francesinhas de Porto.">A 5-min walk up your street at nº 946. Consistently rated one of Porto's best francesinhas.</div>
        <div class="place-meta" data-en="Tue–Sat 12:30–15:00 & 19:00–22:00" data-pt="Ter–Sáb 12h30–15h e 19h–22h" data-es="Mar–Sáb 12:30–15:00 y 19:00–22:00" data-fr="Mar–Sam 12h30–15h et 19h–22h">Tue–Sat 12:30–15:00 & 19:00–22:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJtZ4woVhkJA0R1YIaQGr591Y" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Restaurante Gruta Azul</div><div class="place-rating">⭐ 4.6 · local gem</div></div>
        <div class="place-desc" data-en="Portuguese home cooking at great value, open daily including Sundays. Sunny terrace." data-pt="Cozinha portuguesa caseira a ótimo preço, aberto todos os dias incluindo domingos. Esplanada." data-es="Cocina casera portuguesa a muy buen precio, abierto todos los días. Terraza soleada." data-fr="Cuisine familiale portugaise à excellent rapport qualité-prix, ouvert tous les jours. Terrasse.">Portuguese home cooking at great value, open daily including Sundays. Sunny terrace.</div>
        <div class="place-meta" data-en="Daily 11:00–23:00 (Sun until 15:00)" data-pt="Diário 11h–23h (Dom até 15h)" data-es="Diario 11:00–23:00 (Dom hasta 15:00)" data-fr="Quotidien 11h–23h (Dim jusqu'à 15h)">Daily 11:00–23:00 (Sun until 15:00)</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJVfC48TBlJA0RUq4bGPU46Bc" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Cafés & brunch" data-pt="Cafés & brunch" data-es="Cafés & brunch" data-fr="Cafés & brunch">Cafés & brunch</p>
      <div class="place">
        <div class="place-header"><div class="place-name">BOHO — Eat, drink n' dance</div><div class="place-rating">⭐ 5.0 · 65 reviews</div></div>
        <div class="place-desc" data-en="Beautiful design, gourmet bagels, great wine and an incredible atmosphere. Dog friendly. A hidden gem on your street." data-pt="Design incrível, bagels gourmet, ótimo vinho e ambiente fantástico. Aceita cães. Uma joia escondida na tua rua." data-es="Diseño precioso, bagels gourmet, buen vino y ambiente increíble. Admite perros. Una joya escondida en tu calle." data-fr="Beau design, bagels gastronomiques, excellent vin et atmosphère incroyable. Animaux acceptés. Un joyau caché dans votre rue.">Beautiful design, gourmet bagels, great wine and an incredible atmosphere. Dog friendly. A hidden gem on your street.</div>
        <div class="place-meta" data-en="Tue–Fri 8:00–16:00 · Sat 9:00–17:00" data-pt="Ter–Sex 8h–16h · Sáb 9h–17h" data-es="Mar–Vie 8:00–16:00 · Sáb 9:00–17:00" data-fr="Mar–Ven 8h–16h · Sam 9h–17h">Tue–Fri 8:00–16:00 · Sat 9:00–17:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJX9QPn5VlJA0RC7a722Ao2KU" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Breakfast Lovers Bolhão</div><div class="place-rating">⭐ nearby favourite</div></div>
        <div class="place-desc" data-en="Exceptional brunch, impeccable presentation. ~10 min walk down towards Bolhão." data-pt="Brunch excecional, apresentação impecável. ~10 min a pé em direção ao Bolhão." data-es="Brunch excepcional, presentación impecable. ~10 min a pie hacia el Bolhão." data-fr="Brunch exceptionnel, présentation impeccable. ~10 min à pied vers le Bolhão.">Exceptional brunch, impeccable presentation. ~10 min walk down towards Bolhão.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ3XkGDKFlJA0Rj904CCpHG-o" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🛒</div>
      <div class="section-title" data-en="Supermarkets" data-pt="Supermercados" data-es="Supermercados" data-fr="Supermarchés">Supermarkets</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Ali Supermarket</div>
        <div class="place-desc" data-en="~10 min walk at nº 139. Open until 4am every day — perfect for late arrivals. Just knock if the door is closed!" data-pt="~10 min a pé no nº 139. Aberto até às 4h todos os dias. Bate à porta se estiver fechada!" data-es="~10 min andando en el nº 139. Abierto hasta las 4h todos los días. ¡Llama a la puerta si está cerrada!" data-fr="~10 min à pied au nº 139. Ouvert jusqu'à 4h chaque jour. Frappez si la porte est fermée !">~10 min walk at nº 139. Open until 4am every day — perfect for late arrivals. Just knock if the door is closed!</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJwWHrbdllJA0RvcrYoNNTTDw" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name">PrimaPrix</div>
        <div class="place-desc" data-en="Full supermarket at Rua de Fernandes Tomás 793. Daily 9:30–21:30." data-pt="Supermercado completo na Rua de Fernandes Tomás 793. Diário 9h30–21h30." data-es="Supermercado completo en Rua de Fernandes Tomás 793. Diario 9:30–21:30." data-fr="Supermarché complet à Rua de Fernandes Tomás 793. Quotidien 9h30–21h30.">Full supermarket at Rua de Fernandes Tomás 793. Daily 9:30–21:30.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJadS6u3JlJA0RlqyOqhRACKU" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🚇</div>
      <div class="section-title" data-en="Getting around" data-pt="Transportes" data-es="Cómo moverse" data-fr="Se déplacer">Getting around</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name" data-en="Metro — Marquês (Yellow Line)" data-pt="Metro — Marquês (Linha Amarela)" data-es="Metro — Marquês (Línea Amarilla)" data-fr="Métro — Marquês (Ligne Jaune)">Metro — Marquês (Yellow Line)</div>
        <div class="service-desc" data-en="~8 min walk up the street. Connects to Trindade (city centre) and Casa da Música." data-pt="~8 min a pé subindo a rua. Liga ao Trindade (centro) e à Casa da Música." data-es="~8 min andando calle arriba. Conecta con Trindade (centro) y Casa da Música." data-fr="~8 min à pied en remontant la rue. Connecte au Trindade (centre-ville) et à la Casa da Música.">~8 min walk up the street. Connects to Trindade (city centre) and Casa da Música.</div>
        <a href="https://goo.gl/maps/iVuPw5Y2EBkDD8kE6" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Taxi / Rideshare" data-pt="Taxi / Rideshare" data-es="Taxi / VTC" data-fr="Taxi / VTC">Taxi / Rideshare</div>
        <div class="service-desc" data-en="Taxi rank at Praça do Marquês (~8 min walk). Also: Uber, Bolt, Free Now." data-pt="Praça de taxis no Marquês (~8 min a pé). Também: Uber, Bolt, Free Now." data-es="Parada de taxis en Marquês (~8 min andando). También: Uber, Bolt, Free Now." data-fr="Station de taxis au Marquês (~8 min à pied). Aussi : Uber, Bolt, Free Now.">Taxi rank at Praça do Marquês (~8 min walk). Also: Uber, Bolt, Free Now.</div>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Airport transfer" data-pt="Transfer aeroporto" data-es="Traslado aeropuerto" data-fr="Transfert aéroport">Airport transfer</div>
        <div class="service-desc" data-en="Book a direct ride to/from the apartment." data-pt="Reserva uma viagem direta de/para o apartamento." data-es="Reserva un viaje directo al apartamento." data-fr="Réservez un trajet direct vers l'appartement.">Book a direct ride to/from the apartment.</div>
        <a href="https://bnb.welcomepickups.com/property_groups/311/properties/4632" target="_blank" class="map-link">🚗 <span data-en="Book transfer" data-pt="Reservar transfer" data-es="Reservar traslado" data-fr="Réserver transfert">Book transfer</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🅿️</div>
      <div class="section-title" data-en="Parking" data-pt="Estacionamento" data-es="Aparcamiento" data-fr="Stationnement">Parking</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name" data-en="Private garage — Rua da Alegria 29" data-pt="Garagem privada — Rua da Alegria 29" data-es="Garaje privado — Rua da Alegria 29" data-fr="Garage privé — Rua da Alegria 29">Private garage — Rua da Alegria 29</div>
        <div class="place-desc" data-en="€12/24h · Very convenient, a short walk down the street." data-pt="€12/24h · Muito conveniente, a poucos passos descendo a rua." data-es="€12/24h · Muy conveniente, a poca distancia calle abajo." data-fr="€12/24h · Très pratique, à quelques minutes à pied.">€12/24h · Very convenient, a short walk down the street.</div>
        <a href="https://goo.gl/maps/k9wT1teFpazhJokx6" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name" data-en="Street parking — nearby" data-pt="Estacionamento na rua" data-es="Aparcamiento en la calle" data-fr="Stationnement en rue">Street parking — nearby</div>
        <div class="place-desc" data-en="Paid street parking available nearby." data-pt="Estacionamento pago disponível nas proximidades." data-es="Aparcamiento de pago disponible en las cercanías." data-fr="Stationnement payant disponible à proximité.">Paid street parking available nearby.</div>
        <a href="https://goo.gl/maps/MGYSm7aCMqsj52EK9" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🏪</div>
      <div class="section-title" data-en="Useful services nearby" data-pt="Serviços úteis perto" data-es="Servicios útiles cerca" data-fr="Services utiles à proximité">Useful services nearby</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Pharmacy" data-pt="Farmácia" data-es="Farmacia" data-fr="Pharmacie">Pharmacy</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Farmácia Saúde</div><div class="place-rating">⭐ 4.9 · 51 reviews</div></div>
        <div class="place-desc" data-en="Outstanding pharmacy with exceptional, friendly staff. Highly recommended." data-pt="Farmácia excelente com equipa fantástica e simpática. Muito recomendada." data-es="Farmacia excelente con personal fantástico y amable. Muy recomendada." data-fr="Excellente pharmacie avec un personnel fantastique et sympathique. Très recommandée.">Outstanding pharmacy with exceptional, friendly staff. Highly recommended.</div>
        <div class="place-meta" data-en="Mon–Fri 9:00–19:15 · Sat 9:00–13:00" data-pt="Seg–Sex 9h–19h15 · Sáb 9h–13h" data-es="Lun–Vie 9:00–19:15 · Sáb 9:00–13:00" data-fr="Lun–Ven 9h–19h15 · Sam 9h–13h">Mon–Fri 9:00–19:15 · Sat 9:00–13:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJOwWCG1xkJA0R9AHTKOrYIN8" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Barber" data-pt="Barbearia" data-es="Barbería" data-fr="Barbier">Barber</p>
      <div class="place">
        <div class="place-header"><div class="place-name">ROTA 66 Barbershop</div><div class="place-rating">⭐ 5.0 · 34 reviews</div></div>
        <div class="place-desc" data-en="Right on your street at nº 1804. Perfect cuts and very friendly staff." data-pt="Mesmo na tua rua no nº 1804. Cortes perfeitos e equipa muito simpática." data-es="En tu misma calle en el nº 1804. Cortes perfectos y personal muy amable." data-fr="Sur votre rue au nº 1804. Coupes parfaites et personnel très sympa.">Right on your street at nº 1804. Perfect cuts and very friendly staff.</div>
        <div class="place-meta" data-en="Tue–Sat 10:00–19:00" data-pt="Ter–Sáb 10h–19h" data-es="Mar–Sáb 10:00–19:00" data-fr="Mar–Sam 10h–19h">Tue–Sat 10:00–19:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ12o8lIxlJA0RqkS2-HzbITU" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Laundry" data-pt="Lavandaria" data-es="Lavandería" data-fr="Laverie">Laundry</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Lavandaria Marlinwash</div><div class="place-rating">⭐ 4.5 · 218 reviews</div></div>
        <div class="place-desc" data-en="~10 min walk at nº 166. Self-service, detergent included. Daily 8:00–21:30." data-pt="~10 min a pé no nº 166. Self-service, detergente incluído. Diário 8h–21h30." data-es="~10 min andando en el nº 166. Self-service, detergente incluido. Diario 8:00–21:30." data-fr="~10 min à pied au nº 166. Self-service, lessive incluse. Quotidien 8h–21h30.">~10 min walk at nº 166. Self-service, detergent included. Daily 8:00–21:30.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJRwFy5u9kJA0RHOntiM57qTs" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="ATM / Cash" data-pt="Multibanco" data-es="Cajero" data-fr="Distributeur">ATM / Cash</p>
      <div class="place">
        <div class="place-name" data-en="Multibanco — Rua da Alegria" data-pt="Multibanco — Rua da Alegria" data-es="Cajero — Rua da Alegria" data-fr="Distributeur — Rua da Alegria">Multibanco — Rua da Alegria</div>
        <div class="place-desc" data-en="Use Multibanco (MB) machines — avoid Euronet ATMs (high fees)." data-pt="Usa máquinas Multibanco (MB) — evita Euronet (taxas altas)." data-es="Usa cajeros Multibanco (MB) — evita los Euronet (comisiones altas)." data-fr="Utilisez les distributeurs Multibanco (MB) — évitez Euronet (frais élevés).">Use Multibanco (MB) machines — avoid Euronet ATMs (high fees).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🧳</div>
      <div class="section-title" data-en="Luggage storage" data-pt="Guarda-bagagem" data-es="Consigna de equipaje" data-fr="Consigne à bagages">Luggage storage</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name">Bounce</div>
        <div class="service-desc" data-en="Storage locations nearby from €1/day. 5% discount with our link." data-pt="Locais perto a partir de €1/dia. 5% desconto com o nosso link." data-es="Locales cercanos desde €1/día. 5% descuento con nuestro enlace." data-fr="Lieux à proximité à partir de 1€/jour. 5% de réduction avec notre lien.">Storage locations nearby from €1/day. 5% discount with our link.</div>
        <a href="https://go.bounce.com/PORTOHAVEN7471817336" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
      <div class="service-item">
        <div class="service-name">LUGGit</div>
        <div class="service-desc" data-en="Collects and delivers your bags wherever and whenever. 10% discount for our guests." data-pt="Recolhe e entrega onde e quando quiseres. 10% desconto para os nossos hóspedes." data-es="Recoge y entrega donde y cuando quieras. 10% descuento para nuestros huéspedes." data-fr="Récupère et livre vos bagages où vous voulez. 10% de réduction pour nos clients.">Collects and delivers your bags wherever and whenever. 10% discount for our guests.</div>
        <a href="https://luggit.app/partner/porto-haven" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🗺️</div>
      <div class="section-title" data-en="Things to do" data-pt="O que visitar" data-es="Qué hacer" data-fr="À faire">Things to do</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Casa da Música</div>
        <div class="place-desc" data-en="Iconic concert hall just up the street. Check the programme online." data-pt="Sala de concertos icónica mesmo acima na tua rua. Consulta a programação online." data-es="Sala de conciertos icónica justo calle arriba. Consulta la programación online." data-fr="Salle de concert iconique juste en remontant la rue. Consultez le programme en ligne.">Iconic concert hall just up the street. Check the programme online.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="São Bento Station" data-pt="Estação de São Bento" data-es="Estación de São Bento" data-fr="Gare de São Bento">São Bento Station</div>
        <div class="place-desc" data-en="Stunning azulejo tile panels — free to enter, unmissable." data-pt="Painéis de azulejos impressionantes — entrada gratuita, imperdível." data-es="Impresionantes azulejos — entrada gratuita, imprescindible." data-fr="Magnifiques panneaux d'azulejos — entrée gratuite, incontournable.">Stunning azulejo tile panels — free to enter, unmissable.</div>
      </div>
      <div class="place">
        <div class="place-name">Livraria Lello</div>
        <div class="place-desc" data-en="One of the world's most beautiful bookshops. Book tickets online." data-pt="Uma das livrarias mais bonitas do mundo. Compra bilhetes online." data-es="Una de las librerías más bonitas del mundo. Compra entradas online." data-fr="L'une des plus belles librairies du monde. Achetez les billets en ligne.">One of the world's most beautiful bookshops. Book tickets online.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Ribeira & D. Luís Bridge" data-pt="Ribeira & Ponte D. Luís" data-es="Ribeira & Puente D. Luís" data-fr="Ribeira & Pont D. Luís">Ribeira & D. Luís Bridge</div>
        <div class="place-desc" data-en="Walk the riverside, cross to Gaia for Port wine cellars and incredible views." data-pt="Passeio à beira-rio, atravessa até Gaia para as caves e vistas incríveis." data-es="Paseo por el río, cruza a Gaia para las bodegas y vistas increíbles." data-fr="Promenade au bord du fleuve, traversée vers Gaia pour les caves et les vues incroyables.">Walk the riverside, cross to Gaia for Port wine cellars and incredible views.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Torre dos Clérigos" data-pt="Torre dos Clérigos" data-es="Torre dos Clérigos" data-fr="Tour dos Clérigos">Torre dos Clérigos</div>
        <div class="place-desc" data-en="360° panoramic views of Porto. Worth the climb." data-pt="Vistas panorâmicas 360° do Porto. Vale a subida." data-es="Vistas panorámicas 360° de Oporto. Vale la pena subir." data-fr="Vue panoramique à 360° sur Porto. Ça vaut le détour.">360° panoramic views of Porto. Worth the climb.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Foz do Douro" data-pt="Foz do Douro" data-es="Foz do Douro" data-fr="Foz do Douro">Foz do Douro</div>
        <div class="place-desc" data-en="Where the Douro meets the Atlantic. Walk Avenida Brasil, stop at Docemar for amazing croissants." data-pt="Onde o Douro encontra o Atlântico. Passeio pela Avenida Brasil, para no Docemar." data-es="Donde el Duero encuentra el Atlántico. Paseo por la Avenida Brasil, para en Docemar." data-fr="Où le Douro rencontre l'Atlantique. Promenade Avenida Brasil, arrêt au Docemar.">Where the Douro meets the Atlantic. Walk Avenida Brasil, stop at Docemar for amazing croissants.</div>
      </div>
      <div class="place">
        <div class="place-name">Terraço do Jardim Rooftop</div>
        <div class="place-desc" data-en="Stunning rooftop bar with city views. Daily 11:00–00:00." data-pt="Rooftop com vistas deslumbrantes da cidade. Diário 11h–00h." data-es="Rooftop con vistas impresionantes de la ciudad. Diario 11:00–00:00." data-fr="Bar en terrasse avec de superbes vues sur la ville. Quotidien 11h–00h.">Stunning rooftop bar with city views. Daily 11:00–00:00.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJh1ZsQQBlJA0RNY_5IS7Ix58" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📋</div>
      <div class="section-title" data-en="House rules" data-pt="Regras da casa" data-es="Normas de la casa" data-fr="Règles de la maison">House rules</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="rule"><div class="rule-icon">🚭</div><span data-en="No smoking" data-pt="Proibido fumar" data-es="Prohibido fumar" data-fr="Défense de fumer">No smoking</span></div>
      <div class="rule"><div class="rule-icon">🎉</div><span data-en="No parties or events" data-pt="Sem festas ou eventos" data-es="Sin fiestas ni eventos" data-fr="Pas de fêtes ni d'événements">No parties or events</span></div>
      <div class="rule"><div class="rule-icon">🐾</div><span data-en="No pets" data-pt="Sem animais" data-es="No se admiten mascotas" data-fr="Animaux interdits">No pets</span></div>
      <div class="rule"><div class="rule-icon">🚫</div><span data-en="No external visitors" data-pt="Sem visitas externas" data-es="Sin visitas externas" data-fr="Pas de visiteurs extérieurs">No external visitors</span></div>
      <div class="rule"><div class="rule-icon">👥</div><span data-en="Maximum 6 guests" data-pt="Máximo 6 hóspedes" data-es="Máximo 6 huéspedes" data-fr="Maximum 6 personnes">Maximum 6 guests</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🆘</div>
      <div class="section-title" data-en="Emergency contacts" data-pt="Contactos de emergência" data-es="Contactos de emergencia" data-fr="Contacts d'urgence">Emergency contacts</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="emergency-box">
        <div class="emergency-title" data-en="Emergency numbers" data-pt="Números de emergência" data-es="Números de emergencia" data-fr="Numéros d'urgence">Emergency numbers</div>
        <div class="emergency-row"><span class="emergency-label" data-en="Emergency (EU)" data-pt="Emergência (EU)" data-es="Emergencias (UE)" data-fr="Urgences (UE)">Emergency (EU)</span><span class="emergency-num">112</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Police (PSP)" data-pt="Polícia (PSP)" data-es="Policía (PSP)" data-fr="Police (PSP)">Police (PSP)</span><span class="emergency-num">222 092 000</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Hospital St António" data-pt="Hospital St António" data-es="Hospital St António" data-fr="Hôpital St António">Hospital St António</span><span class="emergency-num">222 077 500</span></div>
      </div>
      <p class="tip" style="margin-top:0.75rem" data-en="For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible." data-pt="Para qualquer problema, envia-nos uma mensagem pela plataforma de reserva." data-es="Para cualquier problema, envíanos un mensaje a través de tu plataforma de reserva." data-fr="Pour tout problème, envoyez-nous un message via votre plateforme de réservation.">For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible.</p>
    </div>
  </div>

</div>
<div class="footer">
  <p data-en="Porto Haven · Alegria 700 · We hope you have a wonderful stay!" data-pt="Porto Haven · Alegria 700 · Esperamos que tenhas uma estadia maravilhosa!" data-es="Porto Haven · Alegria 700 · ¡Esperamos que tengas una estancia maravillosa!" data-fr="Porto Haven · Alegria 700 · Nous vous souhaitons un merveilleux séjour !">Porto Haven · Alegria 700 · We hope you have a wonderful stay!</p>
</div>
<script>
function toggle(h){const b=h.nextElementSibling;const o=b.classList.contains('open');b.classList.toggle('open',!o);h.classList.toggle('open',!o)}
function setLang(l){document.querySelectorAll('[data-en]').forEach(e=>{e.textContent=e.getAttribute('data-'+l)||e.getAttribute('data-en')});const m={'en':'English','pt':'Português','es':'Español','fr':'Français'};document.querySelectorAll('.lang-btn').forEach(b=>{b.classList.toggle('active',b.textContent===m[l])})}
</script>
</body>
</html>`;


const GUIDE_CODECAL1_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Codeçal 1º — Guest Guide</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0;color:#1a1a1a}
.hero{background:#1a1a1a;color:#fff;padding:2rem 1.25rem 1.5rem}
.hero-tag{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:6px}
.hero-title{font-size:26px;font-weight:600;margin-bottom:4px}
.hero-sub{font-size:14px;color:#aaa;margin-bottom:1.25rem}
.lang-toggle{display:flex;gap:8px;flex-wrap:wrap}
.lang-btn{padding:6px 16px;border-radius:20px;border:1px solid #444;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s}
.lang-btn.active{background:#fff;color:#1a1a1a;border-color:#fff}
.hero-map{display:inline-flex;align-items:center;gap:6px;margin-top:1rem;color:#ccc;font-size:13px;text-decoration:none;border-bottom:1px solid #444;padding-bottom:2px}
.container{max-width:600px;margin:0 auto;padding:1rem}
.section{background:#fff;border-radius:12px;margin-bottom:0.75rem;overflow:hidden;border:1px solid #ece9e3}
.section-header{display:flex;align-items:center;gap:10px;padding:1rem 1.25rem;cursor:pointer;user-select:none}
.section-icon{width:32px;height:32px;border-radius:8px;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-title{font-size:15px;font-weight:600;flex:1;color:#1a1a1a}
.section-chevron{font-size:18px;color:#999;transition:transform 0.25s}
.section-body{padding:0 1.25rem 1.25rem;display:none}
.section-body.open{display:block}
.section-header.open .section-chevron{transform:rotate(180deg)}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0.75rem}
.info-card{background:#f7f5f0;border-radius:8px;padding:0.75rem}
.info-card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.info-card-value{font-size:15px;font-weight:600;color:#1a1a1a}
.wifi-box{background:#1a1a1a;color:#fff;border-radius:10px;padding:1rem 1.25rem;margin-bottom:8px}
.wifi-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.wifi-value{font-size:16px;font-weight:600;font-family:monospace;letter-spacing:0.05em}
.place{padding:10px 0;border-bottom:1px solid #f0ede8}
.place:last-child{border-bottom:none}
.place-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}
.place-name{font-size:14px;font-weight:600;color:#1a1a1a}
.place-rating{font-size:12px;color:#f59e0b;font-weight:600;white-space:nowrap}
.place-desc{font-size:12px;color:#666;line-height:1.4;margin-bottom:5px}
.place-meta{font-size:11px;color:#999;margin-bottom:5px}
.map-link{font-size:12px;color:#2563eb;text-decoration:none;display:inline-flex;align-items:center;gap:3px}
.badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:10px;margin-left:5px;font-weight:500}
.badge-reserve{background:#ede9fe;color:#5b21b6}
.rule{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0ede8;font-size:14px}
.rule:last-child{border-bottom:none}
.rule-icon{font-size:16px;width:24px;text-align:center}
.tip{font-size:13px;color:#555;line-height:1.5;padding:8px 0}
.service-item{padding:10px 0;border-bottom:1px solid #f0ede8}
.service-item:last-child{border-bottom:none}
.service-name{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
.service-desc{font-size:12px;color:#666;margin-bottom:5px}
.divider{height:1px;background:#f0ede8;margin:10px 0}
.footer{text-align:center;padding:2rem 1rem;color:#999;font-size:12px}
.emergency-box{background:#fff1f1;border:1px solid #fecaca;border-radius:10px;padding:1rem 1.25rem}
.emergency-title{font-size:13px;font-weight:600;color:#991b1b;margin-bottom:8px}
.emergency-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #fecaca}
.emergency-row:last-child{border-bottom:none}
.emergency-label{color:#666}
.emergency-num{font-weight:600;color:#1a1a1a}
.notice{background:#fff8e6;border:1px solid #f0d080;border-radius:8px;padding:0.75rem 1rem;margin-top:0.75rem;display:flex;gap:8px;align-items:flex-start}
.notice span{font-size:16px;flex-shrink:0}
.notice p{font-size:13px;color:#7a5c00;line-height:1.5}
</style>
</head>
<body>
<div class="hero">
  <div class="hero-tag">Porto Haven</div>
  <div class="hero-title">Under the Luís I Bridge</div>
  <div class="hero-sub" data-en="Escadas de Codeçal, 98 · 1st floor · Porto" data-pt="Escadas de Codeçal, 98 · 1º andar · Porto" data-es="Escadas de Codeçal, 98 · 1er piso · Oporto" data-fr="Escadas de Codeçal, 98 · 1er étage · Porto">Escadas de Codeçal, 98 · 1st floor · Porto</div>
  <div class="lang-toggle">
    <button class="lang-btn active" onclick="setLang('en')">English</button>
    <button class="lang-btn" onclick="setLang('pt')">Português</button>
    <button class="lang-btn" onclick="setLang('es')">Español</button>
    <button class="lang-btn" onclick="setLang('fr')">Français</button>
  </div>
  <a href="https://maps.app.goo.gl/1vJmjJTznV7LiZNfA" target="_blank" class="hero-map">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
</div>
<div class="container">

  <div class="section">
    <div class="section-header open" onclick="toggle(this)">
      <div class="section-icon">🔑</div>
      <div class="section-title" data-en="Check-in & check-out" data-pt="Check-in & check-out" data-es="Check-in & check-out" data-fr="Check-in & check-out">Check-in & check-out</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body open">
      <div class="info-grid">
        <div class="info-card"><div class="info-card-label" data-en="Check-in" data-pt="Check-in" data-es="Check-in" data-fr="Check-in">Check-in</div><div class="info-card-value">16:00 – 00:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Check-out" data-pt="Check-out" data-es="Check-out" data-fr="Check-out">Check-out</div><div class="info-card-value" data-en="by 11:00" data-pt="até às 11:00" data-es="antes de las 11:00" data-fr="avant 11h00">by 11:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (arrival)" data-pt="Deixar malas (chegada)" data-es="Dejar maletas (llegada)" data-fr="Déposer bagages (arrivée)">Drop bags (arrival)</div><div class="info-card-value" data-en="from 12:00" data-pt="a partir das 12:00" data-es="desde las 12:00" data-fr="à partir de 12h00">from 12:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (departure)" data-pt="Deixar malas (saída)" data-es="Dejar maletas (salida)" data-fr="Déposer bagages (départ)">Drop bags (departure)</div><div class="info-card-value" data-en="until 13:00" data-pt="até às 13:00" data-es="hasta las 13:00" data-fr="jusqu'à 13h00">until 13:00</div></div>
      </div>
      <p class="tip" data-en="Self check-in. Your access code is sent 48 hours before arrival. No lift — stairs only." data-pt="Self check-in. Código de acesso enviado 48h antes. Sem elevador — apenas escadas." data-es="Self check-in. Código enviado 48h antes. Sin ascensor — solo escaleras." data-fr="Self check-in. Code envoyé 48h avant. Pas d'ascenseur — escaliers uniquement.">Self check-in. Your access code is sent 48 hours before arrival. No lift — stairs only.</p>
      <p class="tip" data-en="The best way to arrive is by Uber or taxi to the address, then walk 90 metres." data-pt="A melhor forma de chegar é de Uber ou táxi até à morada e depois andar 90 metros." data-es="La mejor forma de llegar es en Uber o taxi y luego caminar 90 metros." data-fr="La meilleure façon d'arriver est en Uber ou taxi, puis marcher 90 mètres.">The best way to arrive is by Uber or taxi to the address, then walk 90 metres.</p>
      <p class="tip" data-en="Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum." data-pt="Infelizmente não conseguimos garantir early check-in ou late check-out, mas podes deixar as malas a partir das 12:00 no dia de chegada, ou até às 13:00 no dia de saída." data-es="Lamentablemente no podemos ofrecer early check-in ni late check-out, pero puedes dejar las maletas desde las 12:00 el día de llegada o hasta las 13:00 el día de salida." data-fr="Malheureusement, pas de check-in anticipé ni check-out tardif, mais vous pouvez déposer vos bagages à partir de 12h00 le jour d'arrivée ou jusqu'à 13h00 le jour du départ.">Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📶</div>
      <div class="section-title">Wi-Fi</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="wifi-box"><div class="wifi-label" data-en="Network" data-pt="Rede" data-es="Red" data-fr="Réseau">Network</div><div class="wifi-value">portohavencodecal1</div></div>
      <div class="wifi-box"><div class="wifi-label">Password</div><div class="wifi-value">@codecal1</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🍽️</div>
      <div class="section-title" data-en="Restaurants & cafés" data-pt="Restaurantes & cafés" data-es="Restaurantes & cafés" data-fr="Restaurants & cafés">Restaurants & cafés</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-header"><div class="place-name">Ribeira Square</div><div class="place-rating">⭐ 4.7 · 3.2k reviews</div></div>
        <div class="place-desc" data-en="Steps from your door. Excellent atmosphere, outstanding seafood rice and black pasta. One of Porto's best." data-pt="A passos da tua porta. Ambiente excelente, arroz de marisco e massa negra extraordinários. Um dos melhores do Porto." data-es="A pasos de tu puerta. Excelente ambiente, arroz de marisco y pasta negra excepcionales. Uno de los mejores de Oporto." data-fr="À quelques pas de votre porte. Excellente ambiance, riz aux fruits de mer et pâtes noires exceptionnels.">Steps from your door. Excellent atmosphere, outstanding seafood rice and black pasta. One of Porto's best.</div>
        <div class="place-meta" data-en="Mon & Thu–Sun 18:00–23:00 (closed Tue–Wed)" data-pt="Seg e Qui–Dom 18h–23h (fechado Ter–Qua)" data-es="Lun y Jue–Dom 18:00–23:00 (cerrado Mar–Mié)" data-fr="Lun et Jeu–Dim 18h–23h (fermé Mar–Mer)">Mon & Thu–Sun 18:00–23:00 (closed Tue–Wed)</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJL-WA9-BkJA0RtIH0b74DFCU" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Terra Nova</div><div class="place-rating">⭐ 4.4 · 2.5k reviews</div></div>
        <div class="place-desc" data-en="On the Cais da Ribeira waterfront. Great octopus risotto, stunning sunset views. Daily." data-pt="No Cais da Ribeira. Ótimo risotto de polvo, vistas deslumbrantes ao pôr do sol. Aberto todos os dias." data-es="En el Cais da Ribeira. Excelente risotto de pulpo, vistas al atardecer. Abierto todos los días." data-fr="Sur le Cais da Ribeira. Excellent risotto de poulpe, vues magnifiques au coucher du soleil.">On the Cais da Ribeira waterfront. Great octopus risotto, stunning sunset views. Daily.</div>
        <div class="place-meta" data-en="Daily 12:00–22:30" data-pt="Diário 12h–22h30" data-es="Diario 12:00–22:30" data-fr="Quotidien 12h–22h30">Daily 12:00–22:30</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJRX-CyOBkJA0Rpb0Vy3djd1A" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Escama — Sea Cuisine</div><div class="place-rating">⭐ 4.3 · creative</div></div>
        <div class="place-desc" data-en="Creative seafood right on the waterfront. Reservation recommended." data-pt="Marisco criativo mesmo junto à água. Reserva recomendada." data-es="Marisco creativo junto al agua. Reserva recomendada." data-fr="Fruits de mer créatifs en bord de rivière. Réservation recommandée.">Creative seafood right on the waterfront. Reservation recommended.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJobMWnF1lJA0R_1YCTJw6jiY" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Cafés" data-pt="Cafés" data-es="Cafés" data-fr="Cafés">Cafés</p>
      <div class="place">
        <div class="place-header"><div class="place-name">My Coffee Porto</div><div class="place-rating">⭐ 4.6 · 1.8k reviews</div></div>
        <div class="place-desc" data-en="Right on your doorstep! Incredible views of the Douro and the bridge, excellent coffee and açaí bowls." data-pt="Mesmo à tua porta! Vistas incríveis do Douro e da Ponte, café excelente e açaí." data-es="¡Justo a tu puerta! Vistas increíbles del Duero y del puente, café excelente y açaí." data-fr="Juste à votre porte ! Vues incroyables sur le Douro et le pont, excellent café et açaí.">Right on your doorstep! Incredible views of the Douro and the bridge, excellent coffee and açaí bowls.</div>
        <div class="place-meta" data-en="Daily 9:00–18:00" data-pt="Diário 9h–18h" data-es="Diario 9:00–18:00" data-fr="Quotidien 9h–18h">Daily 9:00–18:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJRcYRxh9lJA0RHW7fROA6ay0" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">My Ribeira Café</div><div class="place-rating">⭐ 4.3 · cosy</div></div>
        <div class="place-desc" data-en="Cosy riverside café with excellent flat whites and homemade muffins. A real gem." data-pt="Café acolhedor à beira-rio com flat whites excelentes e muffins caseiros. Uma joia." data-es="Café acogedor junto al río con flat whites excelentes y muffins caseros. Una joya." data-fr="Café douillet au bord de la rivière avec d'excellents flat whites et muffins maison.">Cosy riverside café with excellent flat whites and homemade muffins. A real gem.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJi3kAqRdlJA0REmD95ghIcs0" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🛒</div>
      <div class="section-title" data-en="Supermarkets" data-pt="Supermercados" data-es="Supermercados" data-fr="Supermarchés">Supermarkets</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">SPAR — Rua de São João</div>
        <div class="place-desc" data-en="Closest supermarket, ~5 min walk along the waterfront. Daily 9:00–21:00." data-pt="Supermercado mais próximo, ~5 min a pé ao longo da margem do rio. Diário 9h–21h." data-es="Supermercado más cercano, ~5 min andando por el paseo marítimo. Diario 9:00–21:00." data-fr="Supermarché le plus proche, ~5 min à pied le long du front de rivière. Quotidien 9h–21h.">Closest supermarket, ~5 min walk along the waterfront. Daily 9:00–21:00.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJoepOVeBkJA0RGRTQGA63_yM" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name" data-en="Nearest supermarkets" data-pt="Supermercados mais próximos" data-es="Supermercados más cercanos" data-fr="Supermarchés les plus proches">Nearest supermarkets</div>
        <a href="https://maps.app.goo.gl/wwbKoqfoTQZ7JXgMA" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🚇</div>
      <div class="section-title" data-en="Getting around" data-pt="Transportes" data-es="Cómo moverse" data-fr="Se déplacer">Getting around</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name" data-en="Metro — São Bento (~8 min walk)" data-pt="Metro — São Bento (~8 min a pé)" data-es="Metro — São Bento (~8 min andando)" data-fr="Métro — São Bento (~8 min à pied)">Metro — São Bento (~8 min walk)</div>
        <div class="service-desc" data-en="Connects to Trindade, airport and all main points in the city." data-pt="Liga ao Trindade, aeroporto e todos os principais pontos da cidade." data-es="Conecta con Trindade, aeropuerto y todos los puntos principales." data-fr="Connecte au Trindade, l'aéroport et tous les points principaux.">Connects to Trindade, airport and all main points in the city.</div>
        <a href="https://maps.app.goo.gl/BUEoSEHDnDUXDPft8" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Bus — Largo 1º de Dezembro" data-pt="Autocarro — Largo 1º de Dezembro" data-es="Autobús — Largo 1º de Dezembro" data-fr="Bus — Largo 1º de Dezembro">Bus — Largo 1º de Dezembro</div>
        <div class="service-desc" data-en="Lines 207 and 303. At Elevador dos Guindais: line 403." data-pt="Linhas 207 e 303. No Elevador dos Guindais: linha 403." data-es="Líneas 207 y 303. En el Elevador dos Guindais: línea 403." data-fr="Lignes 207 et 303. À l'Elevador dos Guindais : ligne 403.">Lines 207 and 303. At Elevador dos Guindais: line 403.</div>
        <a href="https://maps.app.goo.gl/UvBBQQz4dZPRTzko7" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Historic Tram — Line 1 🚋" data-pt="Eléctrico histórico — Linha 1 🚋" data-es="Tranvía histórico — Línea 1 🚋" data-fr="Tramway historique — Ligne 1 🚋">Historic Tram — Line 1 🚋</div>
        <div class="service-desc" data-en="The closest tram stop is just minutes away. Line 1 offers the best views of Porto's riverfront — a unique experience!" data-pt="A paragem mais próxima fica a poucos minutos. A Linha 1 oferece as melhores vistas do rio — uma experiência única!" data-es="La parada más cercana está a pocos minutos. ¡La Línea 1 ofrece las mejores vistas del río — una experiencia única!" data-fr="L'arrêt le plus proche est à quelques minutes. La Ligne 1 offre les meilleures vues sur le front de rivière — une expérience unique !">The closest tram stop is just minutes away. Line 1 offers the best views of Porto's riverfront — a unique experience!</div>
        <a href="https://g.co/kgs/kzmcYVj" target="_blank" class="map-link">📍 <span data-en="Tram stop" data-pt="Paragem de eléctrico" data-es="Parada de tranvía" data-fr="Arrêt de tramway">Tram stop</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Taxi / Rideshare" data-pt="Taxi / Rideshare" data-es="Taxi / VTC" data-fr="Taxi / VTC">Taxi / Rideshare</div>
        <div class="service-desc" data-en="Uber, Bolt and Free Now all work well. For taxis, ask your host." data-pt="Uber, Bolt e Free Now funcionam muito bem. Para taxis, contacta o anfitrião." data-es="Uber, Bolt y Free Now funcionan muy bien. Para taxis, contacta al anfitrión." data-fr="Uber, Bolt et Free Now fonctionnent très bien. Pour les taxis, contactez votre hôte.">Uber, Bolt and Free Now all work well. For taxis, ask your host.</div>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Airport transfer" data-pt="Transfer aeroporto" data-es="Traslado aeropuerto" data-fr="Transfert aéroport">Airport transfer</div>
        <a href="https://bnb.welcomepickups.com/property_groups/311/properties/4635" target="_blank" class="map-link">🚗 <span data-en="Book transfer" data-pt="Reservar transfer" data-es="Reservar traslado" data-fr="Réserver transfert">Book transfer</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🅿️</div>
      <div class="section-title" data-en="Parking" data-pt="Estacionamento" data-es="Aparcamiento" data-fr="Stationnement">Parking</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Estacionamento Duque de Loulé</div>
        <div class="place-desc" data-en="Safest option. €1.20/h normal or €0.70–0.73/h with pre-paid 42h/72h ticket (buy at reception)." data-pt="Opção mais segura. €1,20/h normal ou €0,70–0,73/h com bilhete pré-pago 42h/72h (compra na receção)." data-es="Opción más segura. €1,20/h normal o €0,70–0,73/h con ticket prepago 42h/72h (compra en recepción)." data-fr="Option la plus sûre. €1,20/h normal ou €0,70–0,73/h avec ticket prépayé 42h/72h (achat à la réception).">Safest option. €1.20/h normal or €0.70–0.73/h with pre-paid 42h/72h ticket (buy at reception).</div>
        <a href="https://maps.app.goo.gl/vwL5RxZyUw86Trb36" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name" data-en="Street parking — Largo 1º de Dezembro / Largo Actor Dias" data-pt="Estacionamento na rua — Largo 1º de Dezembro / Largo Actor Dias" data-es="Aparcamiento en calle" data-fr="Stationnement en rue">Street parking — Largo 1º de Dezembro / Largo Actor Dias</div>
        <div class="place-desc" data-en="Free spots when available — pay at the meter." data-pt="Lugares gratuitos quando disponíveis — paga no parquímetro." data-es="Plazas gratuitas cuando disponibles — paga en el parquímetro." data-fr="Places gratuites si disponibles — payez à l'horodateur.">Free spots when available — pay at the meter.</div>
        <a href="https://maps.app.goo.gl/UvBBQQz4dZPRTzko7" target="_blank" class="map-link">📍 <span data-en="Largo 1º de Dezembro" data-pt="Largo 1º de Dezembro" data-es="Largo 1º de Dezembro" data-fr="Largo 1º de Dezembro">Largo 1º de Dezembro</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🏪</div>
      <div class="section-title" data-en="Useful services nearby" data-pt="Serviços úteis perto" data-es="Servicios útiles cerca" data-fr="Services utiles à proximité">Useful services nearby</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Pharmacy" data-pt="Farmácia" data-es="Farmacia" data-fr="Pharmacie">Pharmacy</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Farmácia Moreno</div><div class="place-rating">⭐ 4.5 · 190 reviews</div></div>
        <div class="place-desc" data-en="Friendly and knowledgeable staff, open daily including Sundays. COVID testing available." data-pt="Equipa simpática e conhecedora, aberta todos os dias incluindo domingos. Testes COVID disponíveis." data-es="Personal amable y experto, abierto todos los días. Pruebas COVID disponibles." data-fr="Personnel sympathique et compétent, ouvert tous les jours. Tests COVID disponibles.">Friendly and knowledgeable staff, open daily including Sundays. COVID testing available.</div>
        <div class="place-meta" data-en="Daily 9:00–21:00" data-pt="Diário 9h–21h" data-es="Diario 9:00–21:00" data-fr="Quotidien 9h–21h">Daily 9:00–21:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJHWs_6-FkJA0RTfA_KqLug2o" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Barber" data-pt="Barbearia" data-es="Barbería" data-fr="Barbier">Barber</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Magnata Barbershop</div><div class="place-rating">⭐ 4.7 · 394 reviews</div></div>
        <div class="place-desc" data-en="Brilliant barbershop near São Bento. Skilled barbers, great atmosphere, highly recommended." data-pt="Barbearia excelente perto de São Bento. Barbeiros habilidosos, ótima atmosfera." data-es="Barbería brillante cerca de São Bento. Barberos habilidosos, gran ambiente." data-fr="Excellente barbière près de São Bento. Barbiers talentueux, super ambiance.">Brilliant barbershop near São Bento. Skilled barbers, great atmosphere, highly recommended.</div>
        <div class="place-meta" data-en="Mon 10:00–18:00 · Tue–Fri 10:00–19:30 · Sat 10:00–18:00" data-pt="Seg 10h–18h · Ter–Sex 10h–19h30 · Sáb 10h–18h" data-es="Lun 10:00–18:00 · Mar–Vie 10:00–19:30 · Sáb 10:00–18:00" data-fr="Lun 10h–18h · Mar–Ven 10h–19h30 · Sam 10h–18h">Mon 10:00–18:00 · Tue–Fri 10:00–19:30 · Sat 10:00–18:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJrfAtYuFkJA0Rsw4BTsqSNx4" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Barbearia Gusto Cordoaria</div><div class="place-rating">⭐ 4.9 · 334 reviews</div></div>
        <div class="place-desc" data-en="The best barber in Porto according to many reviews. Classic style, excellent service, haircut from €8–9." data-pt="O melhor barbeiro do Porto segundo muitas avaliações. Estilo clássico, serviço excelente, corte a partir de €8–9." data-es="El mejor barbero de Oporto según muchas reseñas. Estilo clásico, excelente servicio, corte desde €8–9." data-fr="Le meilleur barbier de Porto selon de nombreux avis. Style classique, excellent service, coupe à partir de 8–9€.">The best barber in Porto according to many reviews. Classic style, excellent service, haircut from €8–9.</div>
        <div class="place-meta" data-en="Mon 9:00–20:00 · Tue–Sat 8:00–20:00" data-pt="Seg 9h–20h · Ter–Sáb 8h–20h" data-es="Lun 9:00–20:00 · Mar–Sáb 8:00–20:00" data-fr="Lun 9h–20h · Mar–Sam 8h–20h">Mon 9:00–20:00 · Tue–Sat 8:00–20:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJP1H0m2hlJA0RMzPn2TS8dN0" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Laundry" data-pt="Lavandaria" data-es="Lavandería" data-fr="Laverie">Laundry</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Marlinwash São Bento</div><div class="place-rating">⭐ 5.0</div></div>
        <div class="place-desc" data-en="New machines, great prices. Self-service, daily 7:30–21:30." data-pt="Máquinas novas, ótimos preços. Self-service, diário 7h30–21h30." data-es="Máquinas nuevas, excelentes precios. Self-service, diario 7:30–21:30." data-fr="Nouvelles machines, excellents prix. Self-service, quotidien 7h30–21h30.">New machines, great prices. Self-service, daily 7:30–21:30.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJJ2KBbfllJA0RzJwb3gPAGK4" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="ATM / Cash" data-pt="Multibanco" data-es="Cajero" data-fr="Distributeur">ATM / Cash</p>
      <div class="place">
        <div class="place-name" data-en="Multibanco — nearby" data-pt="Multibanco — nas proximidades" data-es="Cajero — en las cercanías" data-fr="Distributeur — à proximité">Multibanco — nearby</div>
        <div class="place-desc" data-en="Use Multibanco (MB) machines — avoid Euronet (high fees)." data-pt="Usa máquinas Multibanco (MB) — evita Euronet (taxas altas)." data-es="Usa cajeros Multibanco (MB) — evita Euronet (comisiones altas)." data-fr="Utilisez les distributeurs Multibanco (MB) — évitez Euronet (frais élevés).">Use Multibanco (MB) machines — avoid Euronet (high fees).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🧳</div>
      <div class="section-title" data-en="Luggage storage" data-pt="Guarda-bagagem" data-es="Consigna de equipaje" data-fr="Consigne à bagages">Luggage storage</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name">Bounce</div>
        <div class="service-desc" data-en="Storage locations nearby from €1/day. 5% discount with our link." data-pt="Locais perto a partir de €1/dia. 5% desconto." data-es="Locales cercanos desde €1/día. 5% descuento." data-fr="Lieux à proximité à partir de 1€/jour. 5% de réduction.">Storage locations nearby from €1/day. 5% discount with our link.</div>
        <a href="https://go.bounce.com/PORTOHAVEN7471817336" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
      <div class="service-item">
        <div class="service-name">LUGGit</div>
        <div class="service-desc" data-en="Collects and delivers your bags wherever and whenever. 10% discount." data-pt="Recolhe e entrega onde quiseres. 10% desconto." data-es="Recoge y entrega donde quieras. 10% descuento." data-fr="Récupère et livre vos bagages. 10% de réduction.">Collects and delivers your bags wherever and whenever. 10% discount.</div>
        <a href="https://luggit.app/partner/porto-haven" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🗺️</div>
      <div class="section-title" data-en="Things to do" data-pt="O que visitar" data-es="Qué hacer" data-fr="À faire">Things to do</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name" data-en="Ponte D. Luís I — you're right under it!" data-pt="Ponte D. Luís I — estás mesmo debaixo dela!" data-es="Puente D. Luís I — ¡estás justo debajo!" data-fr="Pont D. Luís I — vous êtes juste en dessous !">Ponte D. Luís I — you're right under it!</div>
        <div class="place-desc" data-en="Cross on foot to Gaia for Port wine cellars, cable car and breathtaking views of Porto." data-pt="Atravessa a pé até Gaia para as caves de vinho do Porto, teleférico e vistas de cortar a respiração." data-es="Cruza a pie hasta Gaia para las bodegas, teleférico y vistas impresionantes de Oporto." data-fr="Traversez à pied jusqu'à Gaia pour les caves de porto, le téléphérique et des vues époustouflantes.">Cross on foot to Gaia for Port wine cellars, cable car and breathtaking views of Porto.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Ribeira — steps from your door" data-pt="Ribeira — a passos da tua porta" data-es="Ribeira — a pasos de tu puerta" data-fr="Ribeira — à quelques pas de votre porte">Ribeira — steps from your door</div>
        <div class="place-desc" data-en="One of Porto's most iconic neighbourhoods. Beautiful squares, restaurants and the river at your feet." data-pt="Um dos bairros mais icónicos do Porto. Praças bonitas, restaurantes e o rio aos teus pés." data-es="Uno de los barrios más icónicos de Oporto. Hermosas plazas, restaurantes y el río a tus pies." data-fr="L'un des quartiers les plus emblématiques de Porto. Belles places, restaurants et la rivière à vos pieds.">One of Porto's most iconic neighbourhoods. Beautiful squares, restaurants and the river at your feet.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="São Bento Station (8 min walk)" data-pt="Estação de São Bento (8 min a pé)" data-es="Estación São Bento (8 min andando)" data-fr="Gare de São Bento (8 min à pied)">São Bento Station (8 min walk)</div>
        <div class="place-desc" data-en="Breathtaking azulejo tile panels — free to enter." data-pt="Painéis de azulejos de cortar a respiração — entrada gratuita." data-es="Impresionantes azulejos — entrada gratuita." data-fr="Magnifiques azulejos — entrée gratuite.">Breathtaking azulejo tile panels — free to enter.</div>
      </div>
      <div class="place">
        <div class="place-name">Livraria Lello</div>
        <div class="place-desc" data-en="One of the world's most beautiful bookshops. Book tickets online." data-pt="Uma das livrarias mais bonitas do mundo. Bilhetes online." data-es="Una de las librerías más bonitas del mundo. Entradas online." data-fr="L'une des plus belles librairies du monde. Billets en ligne.">One of the world's most beautiful bookshops. Book tickets online.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Torre dos Clérigos" data-pt="Torre dos Clérigos" data-es="Torre dos Clérigos" data-fr="Tour dos Clérigos">Torre dos Clérigos</div>
        <div class="place-desc" data-en="360° panoramic views of Porto. Worth the climb." data-pt="Vistas panorâmicas 360° do Porto. Vale a subida." data-es="Vistas panorámicas 360° de Oporto. Vale la pena." data-fr="Vue panoramique à 360° sur Porto. Ça vaut le détour.">360° panoramic views of Porto. Worth the climb.</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📋</div>
      <div class="section-title" data-en="House rules" data-pt="Regras da casa" data-es="Normas de la casa" data-fr="Règles de la maison">House rules</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="rule"><div class="rule-icon">🚭</div><span data-en="No smoking" data-pt="Proibido fumar" data-es="Prohibido fumar" data-fr="Défense de fumer">No smoking</span></div>
      <div class="rule"><div class="rule-icon">🎉</div><span data-en="No parties or events" data-pt="Sem festas ou eventos" data-es="Sin fiestas ni eventos" data-fr="Pas de fêtes ni d'événements">No parties or events</span></div>
      <div class="rule"><div class="rule-icon">🐾</div><span data-en="No pets" data-pt="Sem animais" data-es="No se admiten mascotas" data-fr="Animaux interdits">No pets</span></div>
      <div class="rule"><div class="rule-icon">🚫</div><span data-en="No external visitors" data-pt="Sem visitas externas" data-es="Sin visitas externas" data-fr="Pas de visiteurs extérieurs">No external visitors</span></div>
      <div class="rule"><div class="rule-icon">📖</div><span data-en="Instruction manuals in the TV stand/console in the living room." data-pt="Manuais de instruções na consola/móvel de TV na sala." data-es="Manuales de instrucciones en el mueble TV del salón." data-fr="Manuels d'instructions dans le meuble TV du salon.">Instruction manuals in the TV stand/console in the living room.</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🆘</div>
      <div class="section-title" data-en="Emergency contacts" data-pt="Contactos de emergência" data-es="Contactos de emergencia" data-fr="Contacts d'urgence">Emergency contacts</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="emergency-box">
        <div class="emergency-title" data-en="Emergency numbers" data-pt="Números de emergência" data-es="Números de emergencia" data-fr="Numéros d'urgence">Emergency numbers</div>
        <div class="emergency-row"><span class="emergency-label" data-en="Emergency (EU)" data-pt="Emergência" data-es="Emergencias" data-fr="Urgences">Emergency (EU)</span><span class="emergency-num">112</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Police (PSP)" data-pt="Polícia" data-es="Policía" data-fr="Police">Police (PSP)</span><span class="emergency-num">222 092 000</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Hospital St António" data-pt="Hospital St António" data-es="Hospital St António" data-fr="Hôpital St António">Hospital St António</span><span class="emergency-num">222 077 500</span></div>
      </div>
    </div>
  </div>

</div>
<div class="footer">
  <p data-en="Porto Haven · Under the Luís I Bridge · We hope you have a wonderful stay!" data-pt="Porto Haven · Under the Luís I Bridge · Esperamos que tenhas uma estadia maravilhosa!" data-es="Porto Haven · Under the Luís I Bridge · ¡Esperamos que tengas una estancia maravillosa!" data-fr="Porto Haven · Under the Luís I Bridge · Nous vous souhaitons un merveilleux séjour !">Porto Haven · Under the Luís I Bridge · We hope you have a wonderful stay!</p>
</div>
<script>
function toggle(h){const b=h.nextElementSibling;const o=b.classList.contains('open');b.classList.toggle('open',!o);h.classList.toggle('open',!o)}
function setLang(l){document.querySelectorAll('[data-en]').forEach(e=>{e.textContent=e.getAttribute('data-'+l)||e.getAttribute('data-en')});const m={'en':'English','pt':'Português','es':'Español','fr':'Français'};document.querySelectorAll('.lang-btn').forEach(b=>{b.classList.toggle('active',b.textContent===m[l])})}
</script>
</body>
</html>`;



const GUIDE_CODECAL2_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Codeçal 2º — Guest Guide</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0;color:#1a1a1a}
.hero{background:#1a1a1a;color:#fff;padding:2rem 1.25rem 1.5rem}
.hero-tag{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:6px}
.hero-title{font-size:26px;font-weight:600;margin-bottom:4px}
.hero-sub{font-size:14px;color:#aaa;margin-bottom:1.25rem}
.lang-toggle{display:flex;gap:8px;flex-wrap:wrap}
.lang-btn{padding:6px 16px;border-radius:20px;border:1px solid #444;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s}
.lang-btn.active{background:#fff;color:#1a1a1a;border-color:#fff}
.hero-map{display:inline-flex;align-items:center;gap:6px;margin-top:1rem;color:#ccc;font-size:13px;text-decoration:none;border-bottom:1px solid #444;padding-bottom:2px}
.container{max-width:600px;margin:0 auto;padding:1rem}
.section{background:#fff;border-radius:12px;margin-bottom:0.75rem;overflow:hidden;border:1px solid #ece9e3}
.section-header{display:flex;align-items:center;gap:10px;padding:1rem 1.25rem;cursor:pointer;user-select:none}
.section-icon{width:32px;height:32px;border-radius:8px;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-title{font-size:15px;font-weight:600;flex:1;color:#1a1a1a}
.section-chevron{font-size:18px;color:#999;transition:transform 0.25s}
.section-body{padding:0 1.25rem 1.25rem;display:none}
.section-body.open{display:block}
.section-header.open .section-chevron{transform:rotate(180deg)}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0.75rem}
.info-card{background:#f7f5f0;border-radius:8px;padding:0.75rem}
.info-card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.info-card-value{font-size:15px;font-weight:600;color:#1a1a1a}
.wifi-box{background:#1a1a1a;color:#fff;border-radius:10px;padding:1rem 1.25rem;margin-bottom:8px}
.wifi-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.wifi-value{font-size:16px;font-weight:600;font-family:monospace;letter-spacing:0.05em}
.place{padding:10px 0;border-bottom:1px solid #f0ede8}
.place:last-child{border-bottom:none}
.place-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}
.place-name{font-size:14px;font-weight:600;color:#1a1a1a}
.place-rating{font-size:12px;color:#f59e0b;font-weight:600;white-space:nowrap}
.place-desc{font-size:12px;color:#666;line-height:1.4;margin-bottom:5px}
.place-meta{font-size:11px;color:#999;margin-bottom:5px}
.map-link{font-size:12px;color:#2563eb;text-decoration:none;display:inline-flex;align-items:center;gap:3px}
.badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:10px;margin-left:5px;font-weight:500}
.badge-reserve{background:#ede9fe;color:#5b21b6}
.rule{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0ede8;font-size:14px}
.rule:last-child{border-bottom:none}
.rule-icon{font-size:16px;width:24px;text-align:center}
.tip{font-size:13px;color:#555;line-height:1.5;padding:8px 0}
.service-item{padding:10px 0;border-bottom:1px solid #f0ede8}
.service-item:last-child{border-bottom:none}
.service-name{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
.service-desc{font-size:12px;color:#666;margin-bottom:5px}
.divider{height:1px;background:#f0ede8;margin:10px 0}
.footer{text-align:center;padding:2rem 1rem;color:#999;font-size:12px}
.emergency-box{background:#fff1f1;border:1px solid #fecaca;border-radius:10px;padding:1rem 1.25rem}
.emergency-title{font-size:13px;font-weight:600;color:#991b1b;margin-bottom:8px}
.emergency-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #fecaca}
.emergency-row:last-child{border-bottom:none}
.emergency-label{color:#666}
.emergency-num{font-weight:600;color:#1a1a1a}
.notice{background:#fff8e6;border:1px solid #f0d080;border-radius:8px;padding:0.75rem 1rem;margin-top:0.75rem;display:flex;gap:8px;align-items:flex-start}
.notice span{font-size:16px;flex-shrink:0}
.notice p{font-size:13px;color:#7a5c00;line-height:1.5}
</style>
</head>
<body>
<div class="hero">
  <div class="hero-tag">Porto Haven</div>
  <div class="hero-title">Under the Luís I Bridge</div>
  <div class="hero-sub" data-en="Escadas de Codeçal, 98 · 2nd floor · Porto" data-pt="Escadas de Codeçal, 98 · 2º andar · Porto" data-es="Escadas de Codeçal, 98 · 2º piso · Oporto" data-fr="Escadas de Codeçal, 98 · 2e étage · Porto">Escadas de Codeçal, 98 · 2nd floor · Porto</div>
  <div class="lang-toggle">
    <button class="lang-btn active" onclick="setLang('en')">English</button>
    <button class="lang-btn" onclick="setLang('pt')">Português</button>
    <button class="lang-btn" onclick="setLang('es')">Español</button>
    <button class="lang-btn" onclick="setLang('fr')">Français</button>
  </div>
  <a href="https://maps.app.goo.gl/1vJmjJTznV7LiZNfA" target="_blank" class="hero-map">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
</div>
<div class="container">

  <div class="section">
    <div class="section-header open" onclick="toggle(this)">
      <div class="section-icon">🔑</div>
      <div class="section-title" data-en="Check-in & check-out" data-pt="Check-in & check-out" data-es="Check-in & check-out" data-fr="Check-in & check-out">Check-in & check-out</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body open">
      <div class="info-grid">
        <div class="info-card"><div class="info-card-label" data-en="Check-in" data-pt="Check-in" data-es="Check-in" data-fr="Check-in">Check-in</div><div class="info-card-value">16:00 – 00:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Check-out" data-pt="Check-out" data-es="Check-out" data-fr="Check-out">Check-out</div><div class="info-card-value" data-en="by 11:00" data-pt="até às 11:00" data-es="antes de las 11:00" data-fr="avant 11h00">by 11:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (arrival)" data-pt="Deixar malas (chegada)" data-es="Dejar maletas (llegada)" data-fr="Déposer bagages (arrivée)">Drop bags (arrival)</div><div class="info-card-value" data-en="from 12:00" data-pt="a partir das 12:00" data-es="desde las 12:00" data-fr="à partir de 12h00">from 12:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (departure)" data-pt="Deixar malas (saída)" data-es="Dejar maletas (salida)" data-fr="Déposer bagages (départ)">Drop bags (departure)</div><div class="info-card-value" data-en="until 13:00" data-pt="até às 13:00" data-es="hasta las 13:00" data-fr="jusqu'à 13h00">until 13:00</div></div>
      </div>
      <p class="tip" data-en="Self check-in. Your access code is sent 48 hours before arrival. No lift — stairs only." data-pt="Self check-in. Código de acesso enviado 48h antes. Sem elevador — apenas escadas." data-es="Self check-in. Código enviado 48h antes. Sin ascensor — solo escaleras." data-fr="Self check-in. Code envoyé 48h avant. Pas d'ascenseur — escaliers uniquement.">Self check-in. Your access code is sent 48 hours before arrival. No lift — stairs only.</p>
      <p class="tip" data-en="The best way to arrive is by Uber or taxi to the address, then walk 90 metres." data-pt="A melhor forma de chegar é de Uber ou táxi até à morada e depois andar 90 metros." data-es="La mejor forma de llegar es en Uber o taxi y luego caminar 90 metros." data-fr="La meilleure façon d'arriver est en Uber ou taxi, puis marcher 90 mètres.">The best way to arrive is by Uber or taxi to the address, then walk 90 metres.</p>
      <p class="tip" data-en="Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum." data-pt="Infelizmente não conseguimos garantir early check-in ou late check-out, mas podes deixar as malas a partir das 12:00 no dia de chegada, ou até às 13:00 no dia de saída." data-es="Lamentablemente no podemos ofrecer early check-in ni late check-out, pero puedes dejar las maletas desde las 12:00 el día de llegada o hasta las 13:00 el día de salida." data-fr="Malheureusement, pas de check-in anticipé ni check-out tardif, mais vous pouvez déposer vos bagages à partir de 12h00 le jour d'arrivée ou jusqu'à 13h00 le jour du départ.">Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📶</div>
      <div class="section-title">Wi-Fi</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="wifi-box"><div class="wifi-label" data-en="Network" data-pt="Rede" data-es="Red" data-fr="Réseau">Network</div><div class="wifi-value">portohavencodecal2</div></div>
      <div class="wifi-box"><div class="wifi-label">Password</div><div class="wifi-value">@codecal2</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🍽️</div>
      <div class="section-title" data-en="Restaurants & cafés" data-pt="Restaurantes & cafés" data-es="Restaurantes & cafés" data-fr="Restaurants & cafés">Restaurants & cafés</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-header"><div class="place-name">Ribeira Square</div><div class="place-rating">⭐ 4.7 · 3.2k reviews</div></div>
        <div class="place-desc" data-en="Steps from your door. Excellent atmosphere, outstanding seafood rice and black pasta. One of Porto's best." data-pt="A passos da tua porta. Ambiente excelente, arroz de marisco e massa negra extraordinários. Um dos melhores do Porto." data-es="A pasos de tu puerta. Excelente ambiente, arroz de marisco y pasta negra excepcionales. Uno de los mejores de Oporto." data-fr="À quelques pas de votre porte. Excellente ambiance, riz aux fruits de mer et pâtes noires exceptionnels.">Steps from your door. Excellent atmosphere, outstanding seafood rice and black pasta. One of Porto's best.</div>
        <div class="place-meta" data-en="Mon & Thu–Sun 18:00–23:00 (closed Tue–Wed)" data-pt="Seg e Qui–Dom 18h–23h (fechado Ter–Qua)" data-es="Lun y Jue–Dom 18:00–23:00 (cerrado Mar–Mié)" data-fr="Lun et Jeu–Dim 18h–23h (fermé Mar–Mer)">Mon & Thu–Sun 18:00–23:00 (closed Tue–Wed)</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJL-WA9-BkJA0RtIH0b74DFCU" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Terra Nova</div><div class="place-rating">⭐ 4.4 · 2.5k reviews</div></div>
        <div class="place-desc" data-en="On the Cais da Ribeira waterfront. Great octopus risotto, stunning sunset views. Daily." data-pt="No Cais da Ribeira. Ótimo risotto de polvo, vistas deslumbrantes ao pôr do sol. Aberto todos os dias." data-es="En el Cais da Ribeira. Excelente risotto de pulpo, vistas al atardecer. Abierto todos los días." data-fr="Sur le Cais da Ribeira. Excellent risotto de poulpe, vues magnifiques au coucher du soleil.">On the Cais da Ribeira waterfront. Great octopus risotto, stunning sunset views. Daily.</div>
        <div class="place-meta" data-en="Daily 12:00–22:30" data-pt="Diário 12h–22h30" data-es="Diario 12:00–22:30" data-fr="Quotidien 12h–22h30">Daily 12:00–22:30</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJRX-CyOBkJA0Rpb0Vy3djd1A" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Escama — Sea Cuisine</div><div class="place-rating">⭐ 4.3 · creative</div></div>
        <div class="place-desc" data-en="Creative seafood right on the waterfront. Reservation recommended." data-pt="Marisco criativo mesmo junto à água. Reserva recomendada." data-es="Marisco creativo junto al agua. Reserva recomendada." data-fr="Fruits de mer créatifs en bord de rivière. Réservation recommandée.">Creative seafood right on the waterfront. Reservation recommended.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJobMWnF1lJA0R_1YCTJw6jiY" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Cafés" data-pt="Cafés" data-es="Cafés" data-fr="Cafés">Cafés</p>
      <div class="place">
        <div class="place-header"><div class="place-name">My Coffee Porto</div><div class="place-rating">⭐ 4.6 · 1.8k reviews</div></div>
        <div class="place-desc" data-en="Right on your doorstep! Incredible views of the Douro and the bridge, excellent coffee and açaí bowls." data-pt="Mesmo à tua porta! Vistas incríveis do Douro e da Ponte, café excelente e açaí." data-es="¡Justo a tu puerta! Vistas increíbles del Duero y del puente, café excelente y açaí." data-fr="Juste à votre porte ! Vues incroyables sur le Douro et le pont, excellent café et açaí.">Right on your doorstep! Incredible views of the Douro and the bridge, excellent coffee and açaí bowls.</div>
        <div class="place-meta" data-en="Daily 9:00–18:00" data-pt="Diário 9h–18h" data-es="Diario 9:00–18:00" data-fr="Quotidien 9h–18h">Daily 9:00–18:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJRcYRxh9lJA0RHW7fROA6ay0" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">My Ribeira Café</div><div class="place-rating">⭐ 4.3 · cosy</div></div>
        <div class="place-desc" data-en="Cosy riverside café with excellent flat whites and homemade muffins. A real gem." data-pt="Café acolhedor à beira-rio com flat whites excelentes e muffins caseiros. Uma joia." data-es="Café acogedor junto al río con flat whites excelentes y muffins caseros. Una joya." data-fr="Café douillet au bord de la rivière avec d'excellents flat whites et muffins maison.">Cosy riverside café with excellent flat whites and homemade muffins. A real gem.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJi3kAqRdlJA0REmD95ghIcs0" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🛒</div>
      <div class="section-title" data-en="Supermarkets" data-pt="Supermercados" data-es="Supermercados" data-fr="Supermarchés">Supermarkets</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">SPAR — Rua de São João</div>
        <div class="place-desc" data-en="Closest supermarket, ~5 min walk along the waterfront. Daily 9:00–21:00." data-pt="Supermercado mais próximo, ~5 min a pé ao longo da margem do rio. Diário 9h–21h." data-es="Supermercado más cercano, ~5 min andando por el paseo marítimo. Diario 9:00–21:00." data-fr="Supermarché le plus proche, ~5 min à pied le long du front de rivière. Quotidien 9h–21h.">Closest supermarket, ~5 min walk along the waterfront. Daily 9:00–21:00.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJoepOVeBkJA0RGRTQGA63_yM" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name" data-en="Nearest supermarkets" data-pt="Supermercados mais próximos" data-es="Supermercados más cercanos" data-fr="Supermarchés les plus proches">Nearest supermarkets</div>
        <a href="https://maps.app.goo.gl/wwbKoqfoTQZ7JXgMA" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🚇</div>
      <div class="section-title" data-en="Getting around" data-pt="Transportes" data-es="Cómo moverse" data-fr="Se déplacer">Getting around</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name" data-en="Metro — São Bento (~8 min walk)" data-pt="Metro — São Bento (~8 min a pé)" data-es="Metro — São Bento (~8 min andando)" data-fr="Métro — São Bento (~8 min à pied)">Metro — São Bento (~8 min walk)</div>
        <div class="service-desc" data-en="Connects to Trindade, airport and all main points in the city." data-pt="Liga ao Trindade, aeroporto e todos os principais pontos da cidade." data-es="Conecta con Trindade, aeropuerto y todos los puntos principales." data-fr="Connecte au Trindade, l'aéroport et tous les points principaux.">Connects to Trindade, airport and all main points in the city.</div>
        <a href="https://maps.app.goo.gl/BUEoSEHDnDUXDPft8" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Bus — Largo 1º de Dezembro" data-pt="Autocarro — Largo 1º de Dezembro" data-es="Autobús — Largo 1º de Dezembro" data-fr="Bus — Largo 1º de Dezembro">Bus — Largo 1º de Dezembro</div>
        <div class="service-desc" data-en="Lines 207 and 303. At Elevador dos Guindais: line 403." data-pt="Linhas 207 e 303. No Elevador dos Guindais: linha 403." data-es="Líneas 207 y 303. En el Elevador dos Guindais: línea 403." data-fr="Lignes 207 et 303. À l'Elevador dos Guindais : ligne 403.">Lines 207 and 303. At Elevador dos Guindais: line 403.</div>
        <a href="https://maps.app.goo.gl/UvBBQQz4dZPRTzko7" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Historic Tram — Line 1 🚋" data-pt="Eléctrico histórico — Linha 1 🚋" data-es="Tranvía histórico — Línea 1 🚋" data-fr="Tramway historique — Ligne 1 🚋">Historic Tram — Line 1 🚋</div>
        <div class="service-desc" data-en="The closest tram stop is just minutes away. Line 1 offers the best views of Porto's riverfront — a unique experience!" data-pt="A paragem mais próxima fica a poucos minutos. A Linha 1 oferece as melhores vistas do rio — uma experiência única!" data-es="La parada más cercana está a pocos minutos. ¡La Línea 1 ofrece las mejores vistas del río — una experiencia única!" data-fr="L'arrêt le plus proche est à quelques minutes. La Ligne 1 offre les meilleures vues sur le front de rivière — une expérience unique !">The closest tram stop is just minutes away. Line 1 offers the best views of Porto's riverfront — a unique experience!</div>
        <a href="https://g.co/kgs/kzmcYVj" target="_blank" class="map-link">📍 <span data-en="Tram stop" data-pt="Paragem de eléctrico" data-es="Parada de tranvía" data-fr="Arrêt de tramway">Tram stop</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Taxi / Rideshare" data-pt="Taxi / Rideshare" data-es="Taxi / VTC" data-fr="Taxi / VTC">Taxi / Rideshare</div>
        <div class="service-desc" data-en="Uber, Bolt and Free Now all work well. For taxis, ask your host." data-pt="Uber, Bolt e Free Now funcionam muito bem. Para taxis, contacta o anfitrião." data-es="Uber, Bolt y Free Now funcionan muy bien. Para taxis, contacta al anfitrión." data-fr="Uber, Bolt et Free Now fonctionnent très bien. Pour les taxis, contactez votre hôte.">Uber, Bolt and Free Now all work well. For taxis, ask your host.</div>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Airport transfer" data-pt="Transfer aeroporto" data-es="Traslado aeropuerto" data-fr="Transfert aéroport">Airport transfer</div>
        <a href="https://bnb.welcomepickups.com/property_groups/311/properties/4635" target="_blank" class="map-link">🚗 <span data-en="Book transfer" data-pt="Reservar transfer" data-es="Reservar traslado" data-fr="Réserver transfert">Book transfer</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🅿️</div>
      <div class="section-title" data-en="Parking" data-pt="Estacionamento" data-es="Aparcamiento" data-fr="Stationnement">Parking</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name">Estacionamento Duque de Loulé</div>
        <div class="place-desc" data-en="Safest option. €1.20/h normal or €0.70–0.73/h with pre-paid 42h/72h ticket (buy at reception)." data-pt="Opção mais segura. €1,20/h normal ou €0,70–0,73/h com bilhete pré-pago 42h/72h (compra na receção)." data-es="Opción más segura. €1,20/h normal o €0,70–0,73/h con ticket prepago 42h/72h (compra en recepción)." data-fr="Option la plus sûre. €1,20/h normal ou €0,70–0,73/h avec ticket prépayé 42h/72h (achat à la réception).">Safest option. €1.20/h normal or €0.70–0.73/h with pre-paid 42h/72h ticket (buy at reception).</div>
        <a href="https://maps.app.goo.gl/vwL5RxZyUw86Trb36" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-name" data-en="Street parking — Largo 1º de Dezembro / Largo Actor Dias" data-pt="Estacionamento na rua — Largo 1º de Dezembro / Largo Actor Dias" data-es="Aparcamiento en calle" data-fr="Stationnement en rue">Street parking — Largo 1º de Dezembro / Largo Actor Dias</div>
        <div class="place-desc" data-en="Free spots when available — pay at the meter." data-pt="Lugares gratuitos quando disponíveis — paga no parquímetro." data-es="Plazas gratuitas cuando disponibles — paga en el parquímetro." data-fr="Places gratuites si disponibles — payez à l'horodateur.">Free spots when available — pay at the meter.</div>
        <a href="https://maps.app.goo.gl/UvBBQQz4dZPRTzko7" target="_blank" class="map-link">📍 <span data-en="Largo 1º de Dezembro" data-pt="Largo 1º de Dezembro" data-es="Largo 1º de Dezembro" data-fr="Largo 1º de Dezembro">Largo 1º de Dezembro</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🏪</div>
      <div class="section-title" data-en="Useful services nearby" data-pt="Serviços úteis perto" data-es="Servicios útiles cerca" data-fr="Services utiles à proximité">Useful services nearby</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Pharmacy" data-pt="Farmácia" data-es="Farmacia" data-fr="Pharmacie">Pharmacy</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Farmácia Moreno</div><div class="place-rating">⭐ 4.5 · 190 reviews</div></div>
        <div class="place-desc" data-en="Friendly and knowledgeable staff, open daily including Sundays. COVID testing available." data-pt="Equipa simpática e conhecedora, aberta todos os dias incluindo domingos. Testes COVID disponíveis." data-es="Personal amable y experto, abierto todos los días. Pruebas COVID disponibles." data-fr="Personnel sympathique et compétent, ouvert tous les jours. Tests COVID disponibles.">Friendly and knowledgeable staff, open daily including Sundays. COVID testing available.</div>
        <div class="place-meta" data-en="Daily 9:00–21:00" data-pt="Diário 9h–21h" data-es="Diario 9:00–21:00" data-fr="Quotidien 9h–21h">Daily 9:00–21:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJHWs_6-FkJA0RTfA_KqLug2o" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Barber" data-pt="Barbearia" data-es="Barbería" data-fr="Barbier">Barber</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Magnata Barbershop</div><div class="place-rating">⭐ 4.7 · 394 reviews</div></div>
        <div class="place-desc" data-en="Brilliant barbershop near São Bento. Skilled barbers, great atmosphere, highly recommended." data-pt="Barbearia excelente perto de São Bento. Barbeiros habilidosos, ótima atmosfera." data-es="Barbería brillante cerca de São Bento. Barberos habilidosos, gran ambiente." data-fr="Excellente barbière près de São Bento. Barbiers talentueux, super ambiance.">Brilliant barbershop near São Bento. Skilled barbers, great atmosphere, highly recommended.</div>
        <div class="place-meta" data-en="Mon 10:00–18:00 · Tue–Fri 10:00–19:30 · Sat 10:00–18:00" data-pt="Seg 10h–18h · Ter–Sex 10h–19h30 · Sáb 10h–18h" data-es="Lun 10:00–18:00 · Mar–Vie 10:00–19:30 · Sáb 10:00–18:00" data-fr="Lun 10h–18h · Mar–Ven 10h–19h30 · Sam 10h–18h">Mon 10:00–18:00 · Tue–Fri 10:00–19:30 · Sat 10:00–18:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJrfAtYuFkJA0Rsw4BTsqSNx4" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Barbearia Gusto Cordoaria</div><div class="place-rating">⭐ 4.9 · 334 reviews</div></div>
        <div class="place-desc" data-en="The best barber in Porto according to many reviews. Classic style, excellent service, haircut from €8–9." data-pt="O melhor barbeiro do Porto segundo muitas avaliações. Estilo clássico, serviço excelente, corte a partir de €8–9." data-es="El mejor barbero de Oporto según muchas reseñas. Estilo clásico, excelente servicio, corte desde €8–9." data-fr="Le meilleur barbier de Porto selon de nombreux avis. Style classique, excellent service, coupe à partir de 8–9€.">The best barber in Porto according to many reviews. Classic style, excellent service, haircut from €8–9.</div>
        <div class="place-meta" data-en="Mon 9:00–20:00 · Tue–Sat 8:00–20:00" data-pt="Seg 9h–20h · Ter–Sáb 8h–20h" data-es="Lun 9:00–20:00 · Mar–Sáb 8:00–20:00" data-fr="Lun 9h–20h · Mar–Sam 8h–20h">Mon 9:00–20:00 · Tue–Sat 8:00–20:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJP1H0m2hlJA0RMzPn2TS8dN0" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Laundry" data-pt="Lavandaria" data-es="Lavandería" data-fr="Laverie">Laundry</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Marlinwash São Bento</div><div class="place-rating">⭐ 5.0</div></div>
        <div class="place-desc" data-en="New machines, great prices. Self-service, daily 7:30–21:30." data-pt="Máquinas novas, ótimos preços. Self-service, diário 7h30–21h30." data-es="Máquinas nuevas, excelentes precios. Self-service, diario 7:30–21:30." data-fr="Nouvelles machines, excellents prix. Self-service, quotidien 7h30–21h30.">New machines, great prices. Self-service, daily 7:30–21:30.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJJ2KBbfllJA0RzJwb3gPAGK4" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="ATM / Cash" data-pt="Multibanco" data-es="Cajero" data-fr="Distributeur">ATM / Cash</p>
      <div class="place">
        <div class="place-name" data-en="Multibanco — nearby" data-pt="Multibanco — nas proximidades" data-es="Cajero — en las cercanías" data-fr="Distributeur — à proximité">Multibanco — nearby</div>
        <div class="place-desc" data-en="Use Multibanco (MB) machines — avoid Euronet (high fees)." data-pt="Usa máquinas Multibanco (MB) — evita Euronet (taxas altas)." data-es="Usa cajeros Multibanco (MB) — evita Euronet (comisiones altas)." data-fr="Utilisez les distributeurs Multibanco (MB) — évitez Euronet (frais élevés).">Use Multibanco (MB) machines — avoid Euronet (high fees).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🧳</div>
      <div class="section-title" data-en="Luggage storage" data-pt="Guarda-bagagem" data-es="Consigna de equipaje" data-fr="Consigne à bagages">Luggage storage</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name">Bounce</div>
        <div class="service-desc" data-en="Storage locations nearby from €1/day. 5% discount with our link." data-pt="Locais perto a partir de €1/dia. 5% desconto." data-es="Locales cercanos desde €1/día. 5% descuento." data-fr="Lieux à proximité à partir de 1€/jour. 5% de réduction.">Storage locations nearby from €1/day. 5% discount with our link.</div>
        <a href="https://go.bounce.com/PORTOHAVEN7471817336" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
      <div class="service-item">
        <div class="service-name">LUGGit</div>
        <div class="service-desc" data-en="Collects and delivers your bags wherever and whenever. 10% discount." data-pt="Recolhe e entrega onde quiseres. 10% desconto." data-es="Recoge y entrega donde quieras. 10% descuento." data-fr="Récupère et livre vos bagages. 10% de réduction.">Collects and delivers your bags wherever and whenever. 10% discount.</div>
        <a href="https://luggit.app/partner/porto-haven" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🗺️</div>
      <div class="section-title" data-en="Things to do" data-pt="O que visitar" data-es="Qué hacer" data-fr="À faire">Things to do</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name" data-en="Ponte D. Luís I — you're right under it!" data-pt="Ponte D. Luís I — estás mesmo debaixo dela!" data-es="Puente D. Luís I — ¡estás justo debajo!" data-fr="Pont D. Luís I — vous êtes juste en dessous !">Ponte D. Luís I — you're right under it!</div>
        <div class="place-desc" data-en="Cross on foot to Gaia for Port wine cellars, cable car and breathtaking views of Porto." data-pt="Atravessa a pé até Gaia para as caves de vinho do Porto, teleférico e vistas de cortar a respiração." data-es="Cruza a pie hasta Gaia para las bodegas, teleférico y vistas impresionantes de Oporto." data-fr="Traversez à pied jusqu'à Gaia pour les caves de porto, le téléphérique et des vues époustouflantes.">Cross on foot to Gaia for Port wine cellars, cable car and breathtaking views of Porto.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Ribeira — steps from your door" data-pt="Ribeira — a passos da tua porta" data-es="Ribeira — a pasos de tu puerta" data-fr="Ribeira — à quelques pas de votre porte">Ribeira — steps from your door</div>
        <div class="place-desc" data-en="One of Porto's most iconic neighbourhoods. Beautiful squares, restaurants and the river at your feet." data-pt="Um dos bairros mais icónicos do Porto. Praças bonitas, restaurantes e o rio aos teus pés." data-es="Uno de los barrios más icónicos de Oporto. Hermosas plazas, restaurantes y el río a tus pies." data-fr="L'un des quartiers les plus emblématiques de Porto. Belles places, restaurants et la rivière à vos pieds.">One of Porto's most iconic neighbourhoods. Beautiful squares, restaurants and the river at your feet.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="São Bento Station (8 min walk)" data-pt="Estação de São Bento (8 min a pé)" data-es="Estación São Bento (8 min andando)" data-fr="Gare de São Bento (8 min à pied)">São Bento Station (8 min walk)</div>
        <div class="place-desc" data-en="Breathtaking azulejo tile panels — free to enter." data-pt="Painéis de azulejos de cortar a respiração — entrada gratuita." data-es="Impresionantes azulejos — entrada gratuita." data-fr="Magnifiques azulejos — entrée gratuite.">Breathtaking azulejo tile panels — free to enter.</div>
      </div>
      <div class="place">
        <div class="place-name">Livraria Lello</div>
        <div class="place-desc" data-en="One of the world's most beautiful bookshops. Book tickets online." data-pt="Uma das livrarias mais bonitas do mundo. Bilhetes online." data-es="Una de las librerías más bonitas del mundo. Entradas online." data-fr="L'une des plus belles librairies du monde. Billets en ligne.">One of the world's most beautiful bookshops. Book tickets online.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Torre dos Clérigos" data-pt="Torre dos Clérigos" data-es="Torre dos Clérigos" data-fr="Tour dos Clérigos">Torre dos Clérigos</div>
        <div class="place-desc" data-en="360° panoramic views of Porto. Worth the climb." data-pt="Vistas panorâmicas 360° do Porto. Vale a subida." data-es="Vistas panorámicas 360° de Oporto. Vale la pena." data-fr="Vue panoramique à 360° sur Porto. Ça vaut le détour.">360° panoramic views of Porto. Worth the climb.</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📋</div>
      <div class="section-title" data-en="House rules" data-pt="Regras da casa" data-es="Normas de la casa" data-fr="Règles de la maison">House rules</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="rule"><div class="rule-icon">🚭</div><span data-en="No smoking" data-pt="Proibido fumar" data-es="Prohibido fumar" data-fr="Défense de fumer">No smoking</span></div>
      <div class="rule"><div class="rule-icon">🎉</div><span data-en="No parties or events" data-pt="Sem festas ou eventos" data-es="Sin fiestas ni eventos" data-fr="Pas de fêtes ni d'événements">No parties or events</span></div>
      <div class="rule"><div class="rule-icon">🐾</div><span data-en="No pets" data-pt="Sem animais" data-es="No se admiten mascotas" data-fr="Animaux interdits">No pets</span></div>
      <div class="rule"><div class="rule-icon">🚫</div><span data-en="No external visitors" data-pt="Sem visitas externas" data-es="Sin visitas externas" data-fr="Pas de visiteurs extérieurs">No external visitors</span></div>
      <div class="rule"><div class="rule-icon">📖</div><span data-en="Instruction manuals in the TV stand/console in the living room." data-pt="Manuais de instruções na consola/móvel de TV na sala." data-es="Manuales de instrucciones en el mueble TV del salón." data-fr="Manuels d'instructions dans le meuble TV du salon.">Instruction manuals in the TV stand/console in the living room.</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🆘</div>
      <div class="section-title" data-en="Emergency contacts" data-pt="Contactos de emergência" data-es="Contactos de emergencia" data-fr="Contacts d'urgence">Emergency contacts</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="emergency-box">
        <div class="emergency-title" data-en="Emergency numbers" data-pt="Números de emergência" data-es="Números de emergencia" data-fr="Numéros d'urgence">Emergency numbers</div>
        <div class="emergency-row"><span class="emergency-label" data-en="Emergency (EU)" data-pt="Emergência" data-es="Emergencias" data-fr="Urgences">Emergency (EU)</span><span class="emergency-num">112</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Police (PSP)" data-pt="Polícia" data-es="Policía" data-fr="Police">Police (PSP)</span><span class="emergency-num">222 092 000</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Hospital St António" data-pt="Hospital St António" data-es="Hospital St António" data-fr="Hôpital St António">Hospital St António</span><span class="emergency-num">222 077 500</span></div>
      </div>
    </div>
  </div>

</div>
<div class="footer">
  <p data-en="Porto Haven · Under the Luís I Bridge (2nd floor) · We hope you have a wonderful stay!" data-pt="Porto Haven · Under the Luís I Bridge (2º andar) · Esperamos que tenhas uma estadia maravilhosa!" data-es="Porto Haven · Under the Luís I Bridge · ¡Esperamos que tengas una estancia maravillosa!" data-fr="Porto Haven · Under the Luís I Bridge · Nous vous souhaitons un merveilleux séjour !">Porto Haven · Under the Luís I Bridge · We hope you have a wonderful stay!</p>
</div>
<script>
function toggle(h){const b=h.nextElementSibling;const o=b.classList.contains('open');b.classList.toggle('open',!o);h.classList.toggle('open',!o)}
function setLang(l){document.querySelectorAll('[data-en]').forEach(e=>{e.textContent=e.getAttribute('data-'+l)||e.getAttribute('data-en')});const m={'en':'English','pt':'Português','es':'Español','fr':'Français'};document.querySelectorAll('.lang-btn').forEach(b=>{b.classList.toggle('active',b.textContent===m[l])})}
</script>
</body>
</html>`;
const GUIDE_ALVALADE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Alvalade — Guest Guide</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0;color:#1a1a1a}
.hero{background:#1a1a1a;color:#fff;padding:2rem 1.25rem 1.5rem}
.hero-tag{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:6px}
.hero-title{font-size:26px;font-weight:600;margin-bottom:4px}
.hero-sub{font-size:14px;color:#aaa;margin-bottom:1.25rem}
.lang-toggle{display:flex;gap:8px;flex-wrap:wrap}
.lang-btn{padding:6px 16px;border-radius:20px;border:1px solid #444;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s}
.lang-btn.active{background:#fff;color:#1a1a1a;border-color:#fff}
.hero-map{display:inline-flex;align-items:center;gap:6px;margin-top:1rem;color:#ccc;font-size:13px;text-decoration:none;border-bottom:1px solid #444;padding-bottom:2px}
.container{max-width:600px;margin:0 auto;padding:1rem}
.section{background:#fff;border-radius:12px;margin-bottom:0.75rem;overflow:hidden;border:1px solid #ece9e3}
.section-header{display:flex;align-items:center;gap:10px;padding:1rem 1.25rem;cursor:pointer;user-select:none}
.section-icon{width:32px;height:32px;border-radius:8px;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-title{font-size:15px;font-weight:600;flex:1;color:#1a1a1a}
.section-chevron{font-size:18px;color:#999;transition:transform 0.25s}
.section-body{padding:0 1.25rem 1.25rem;display:none}
.section-body.open{display:block}
.section-header.open .section-chevron{transform:rotate(180deg)}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0.75rem}
.info-card{background:#f7f5f0;border-radius:8px;padding:0.75rem}
.info-card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.info-card-value{font-size:15px;font-weight:600;color:#1a1a1a}
.wifi-box{background:#1a1a1a;color:#fff;border-radius:10px;padding:1rem 1.25rem;margin-bottom:8px}
.wifi-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.wifi-value{font-size:16px;font-weight:600;font-family:monospace;letter-spacing:0.05em}
.place{padding:10px 0;border-bottom:1px solid #f0ede8}
.place:last-child{border-bottom:none}
.place-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}
.place-name{font-size:14px;font-weight:600;color:#1a1a1a}
.place-rating{font-size:12px;color:#f59e0b;font-weight:600;white-space:nowrap}
.place-desc{font-size:12px;color:#666;line-height:1.4;margin-bottom:5px}
.place-meta{font-size:11px;color:#999;margin-bottom:5px}
.map-link{font-size:12px;color:#2563eb;text-decoration:none;display:inline-flex;align-items:center;gap:3px}
.rule{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0ede8;font-size:14px}
.rule:last-child{border-bottom:none}
.rule-icon{font-size:16px;width:24px;text-align:center}
.tip{font-size:13px;color:#555;line-height:1.5;padding:8px 0}
.service-item{padding:10px 0;border-bottom:1px solid #f0ede8}
.service-item:last-child{border-bottom:none}
.service-name{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
.service-desc{font-size:12px;color:#666;margin-bottom:5px}
.divider{height:1px;background:#f0ede8;margin:10px 0}
.footer{text-align:center;padding:2rem 1rem;color:#999;font-size:12px}
.emergency-box{background:#fff1f1;border:1px solid #fecaca;border-radius:10px;padding:1rem 1.25rem}
.emergency-title{font-size:13px;font-weight:600;color:#991b1b;margin-bottom:8px}
.emergency-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #fecaca}
.emergency-row:last-child{border-bottom:none}
.emergency-label{color:#666}
.emergency-num{font-weight:600;color:#1a1a1a}
.notice{background:#fff8e6;border:1px solid #f0d080;border-radius:8px;padding:0.75rem 1rem;margin-top:0.75rem;display:flex;gap:8px}
.notice p{font-size:13px;color:#7a5c00;line-height:1.5}
</style>
</head>
<body>
<div class="hero">
  <div class="hero-tag">Lisbon Haven</div>
  <div class="hero-title">Alvalade</div>
  <div class="hero-sub" data-en="Rua Alberto Oliveira, 31 · Ground floor left · Lisbon" data-pt="Rua Alberto Oliveira, 31 · Rés-do-chão esquerdo · Lisboa" data-es="Rua Alberto Oliveira, 31 · Planta baja izquierda · Lisboa" data-fr="Rua Alberto Oliveira, 31 · Rez-de-chaussée gauche · Lisbonne">Rua Alberto Oliveira, 31 · Ground floor left · Lisbon</div>
  <div class="lang-toggle">
    <button class="lang-btn active" onclick="setLang('en')">English</button>
    <button class="lang-btn" onclick="setLang('pt')">Português</button>
    <button class="lang-btn" onclick="setLang('es')">Español</button>
    <button class="lang-btn" onclick="setLang('fr')">Français</button>
  </div>
  <a href="https://maps.app.goo.gl/9x7QZz45LFiosCBV9" target="_blank" class="hero-map">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
</div>
<div class="container">

  <div class="section">
    <div class="section-header open" onclick="toggle(this)">
      <div class="section-icon">🔑</div>
      <div class="section-title" data-en="Check-in & check-out" data-pt="Check-in & check-out" data-es="Check-in & check-out" data-fr="Check-in & check-out">Check-in & check-out</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body open">
      <div class="info-grid">
        <div class="info-card"><div class="info-card-label" data-en="Check-in" data-pt="Check-in" data-es="Check-in" data-fr="Check-in">Check-in</div><div class="info-card-value">16:00 – 00:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Check-out" data-pt="Check-out" data-es="Check-out" data-fr="Check-out">Check-out</div><div class="info-card-value" data-en="by 11:00" data-pt="até às 11:00" data-es="antes de las 11:00" data-fr="avant 11h00">by 11:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (arrival)" data-pt="Deixar malas (chegada)" data-es="Dejar maletas (llegada)" data-fr="Déposer bagages (arrivée)">Drop bags (arrival)</div><div class="info-card-value" data-en="from 12:00" data-pt="a partir das 12:00" data-es="desde las 12:00" data-fr="à partir de 12h00">from 12:00</div></div>
        <div class="info-card"><div class="info-card-label" data-en="Drop bags (departure)" data-pt="Deixar malas (saída)" data-es="Dejar maletas (salida)" data-fr="Déposer bagages (départ)">Drop bags (departure)</div><div class="info-card-value" data-en="until 13:00" data-pt="até às 13:00" data-es="hasta las 13:00" data-fr="jusqu'à 13h00">until 13:00</div></div>
      </div>
      <p class="tip" data-en="Self check-in. Your access code is sent 48 hours before arrival." data-pt="Self check-in. O código de acesso é enviado 48h antes." data-es="Self check-in. Tu código se envía 48h antes." data-fr="Self check-in. Votre code est envoyé 48h avant.">Self check-in. Your access code is sent 48 hours before arrival.</p>
      <p class="tip" data-en="Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum." data-pt="Infelizmente não conseguimos garantir early check-in ou late check-out, mas podes deixar as malas a partir das 12:00 ou até às 13:00 no dia de saída." data-es="Lamentablemente no podemos ofrecer early check-in ni late check-out, pero puedes dejar las maletas desde las 12:00 o hasta las 13:00 el día de salida." data-fr="Malheureusement, pas de check-in anticipé ni check-out tardif, mais dépôt bagages possible à partir de 12h00 ou jusqu'à 13h00 le jour du départ.">Unfortunately we cannot offer an early check-in or late check-out as we are normally fully booked, but you can drop your bags inside the apartment from 12:00 on arrival day, or leave your bags in the apartment at check-out until 13:00 maximum.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📶</div>
      <div class="section-title">Wi-Fi</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="wifi-box"><div class="wifi-label" data-en="Network" data-pt="Rede" data-es="Red" data-fr="Réseau">Network</div><div class="wifi-value">Vodafone-D81167</div></div>
      <div class="wifi-box"><div class="wifi-label">Password</div><div class="wifi-value">N8hqT2TwT6</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🍽️</div>
      <div class="section-title" data-en="Restaurants & cafés" data-pt="Restaurantes & cafés" data-es="Restaurantes & cafés" data-fr="Restaurants & cafés">Restaurants & cafés</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-header"><div class="place-name">Pomar de Alvalade</div><div class="place-rating">⭐ 4.2 · 985 reviews</div></div>
        <div class="place-desc" data-en="Delicious, authentic Portuguese food at great value. Very busy — everything is super fresh. Steps away." data-pt="Comida portuguesa deliciosa e autêntica a ótimo preço. Muito concorrido — tudo muito fresco. A passos." data-es="Deliciosa comida portuguesa auténtica a muy buen precio. Muy concurrido — todo superfrescho. A pasos." data-fr="Délicieuse cuisine portugaise authentique à excellent rapport qualité-prix. Très fréquenté — tout est très frais.">Delicious, authentic Portuguese food at great value. Very busy — everything is super fresh. Steps away.</div>
        <div class="place-meta" data-en="Mon–Sat 8:00–22:00" data-pt="Seg–Sáb 8h–22h" data-es="Lun–Sáb 8:00–22:00" data-fr="Lun–Sam 8h–22h">Mon–Sat 8:00–22:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJvTgW2qozGQ0RhJecOvh1Xfk" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Sem Nome</div><div class="place-rating">⭐ 4.3 · 478 reviews</div></div>
        <div class="place-desc" data-en="Traditional Portuguese restaurant at reasonable prices. Very fresh fish, attentive service." data-pt="Restaurante português tradicional a preços razoáveis. Peixe muito fresco, serviço atencioso." data-es="Restaurante portugués tradicional a precios razonables. Pescado muy fresco, servicio atento." data-fr="Restaurant portugais traditionnel à prix raisonnables. Poisson très frais, service attentionné.">Traditional Portuguese restaurant at reasonable prices. Very fresh fish, attentive service.</div>
        <div class="place-meta" data-en="Mon–Fri 12:00–15:00 & 19:00–22:00 · Sat 12:00–15:00" data-pt="Seg–Sex 12h–15h e 19h–22h · Sáb 12h–15h" data-es="Lun–Vie 12:00–15:00 y 19:00–22:00 · Sáb 12:00–15:00" data-fr="Lun–Ven 12h–15h et 19h–22h · Sam 12h–15h">Mon–Fri 12:00–15:00 & 19:00–22:00 · Sat 12:00–15:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJJSxPzaozGQ0R4RZNSrNU0HE" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Sea Me Alvalade</div><div class="place-rating">⭐ 4.2 · seafood</div></div>
        <div class="place-desc" data-en="Contemporary seafood on Avenida da Igreja. Excellent oysters and octopus. Inventive menu." data-pt="Marisco contemporâneo na Avenida da Igreja. Ostras e polvo excelentes. Menu criativo." data-es="Marisco contemporáneo en la Avenida da Igreja. Excelentes ostras y pulpo. Menú creativo." data-fr="Fruits de mer contemporains sur l'Avenida da Igreja. Excellentes huîtres et poulpe. Menu inventif.">Contemporary seafood on Avenida da Igreja. Excellent oysters and octopus. Inventive menu.</div>
        <div class="place-meta" data-en="Daily 12:00–15:30 & 19:30–23:00 (Fri–Sat until 00:00)" data-pt="Diário 12h–15h30 e 19h30–23h (Sex–Sáb até 00h)" data-es="Diario 12:00–15:30 y 19:30–23:00 (Vie–Sáb hasta 00:00)" data-fr="Quotidien 12h–15h30 et 19h30–23h (Ven–Sam jusqu'à 00h)">Daily 12:00–15:30 & 19:30–23:00 (Fri–Sat until 00:00)</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJww9Jn2UzGQ0RNG_hDgiY3zY" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Cafés & bakeries" data-pt="Cafés & padarias" data-es="Cafés & panaderías" data-fr="Cafés & boulangeries">Cafés & bakeries</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Do Beco Alvalade</div><div class="place-rating">⭐ 4.9 · 80 reviews</div></div>
        <div class="place-desc" data-en="Artisanal bakery and specialty coffee. Exceptional yoghurt bowls and beautiful pastries. Right on your street!" data-pt="Padaria artesanal e café de especialidade. Yoghurt bowls excecionais e pastéis lindos. Mesmo na tua rua!" data-es="Panadería artesanal y café de especialidad. Yogur bowls excepcionales y pasteles preciosos. ¡En tu misma calle!" data-fr="Boulangerie artisanale et café de spécialité. Bols de yaourt exceptionnels et pâtisseries magnifiques. Dans votre rue !">Artisanal bakery and specialty coffee. Exceptional yoghurt bowls and beautiful pastries. Right on your street!</div>
        <div class="place-meta" data-en="Mon–Fri 8:30–18:30 · Sat–Sun 9:00–19:00" data-pt="Seg–Sex 8h30–18h30 · Sáb–Dom 9h–19h" data-es="Lun–Vie 8:30–18:30 · Sáb–Dom 9:00–19:00" data-fr="Lun–Ven 8h30–18h30 · Sam–Dim 9h–19h">Mon–Fri 8:30–18:30 · Sat–Sun 9:00–19:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJwUQfbrUzGQ0R1niba0KwF6E" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Café Na Drogaria</div><div class="place-rating">⭐ 4.7 · local gem</div></div>
        <div class="place-desc" data-en="Wonderfully welcoming café with lovely owners. Fresh pastries and great coffee. A Alvalade classic." data-pt="Café maravilhosamente acolhedor com donos adoráveis. Pastéis frescos e café ótimo. Um clássico de Alvalade." data-es="Café maravillosamente acogedor con dueños encantadores. Bollería fresca y café excelente. Un clásico de Alvalade." data-fr="Café merveilleusement accueillant avec de charmants propriétaires. Pâtisseries fraîches et excellent café.">Wonderfully welcoming café with lovely owners. Fresh pastries and great coffee. A Alvalade classic.</div>
        <div class="place-meta" data-en="Mon–Fri 8:00–19:00 · Sat 8:00–13:00" data-pt="Seg–Sex 8h–19h · Sáb 8h–13h" data-es="Lun–Vie 8:00–19:00 · Sáb 8:00–13:00" data-fr="Lun–Ven 8h–19h · Sam 8h–13h">Mon–Fri 8:00–19:00 · Sat 8:00–13:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJn-54MlUyGQ0RHvmMnwxFlsM" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="place">
        <div class="place-header"><div class="place-name">Cafélia</div><div class="place-rating">⭐ 4.7 · specialty coffee</div></div>
        <div class="place-desc" data-en="One of Lisbon's best coffee shops. Outstanding selection of coffees, teas and biscuits. Cash only." data-pt="Uma das melhores lojas de café de Lisboa. Seleção extraordinária de cafés, chás e bolachas. Só dinheiro." data-es="Una de las mejores cafeterías de Lisboa. Extraordinaria selección de cafés, tés y galletas. Solo efectivo." data-fr="L'une des meilleures boutiques de café de Lisbonne. Sélection extraordinaire de cafés, thés et biscuits. Espèces uniquement.">One of Lisbon's best coffee shops. Outstanding selection of coffees, teas and biscuits. Cash only.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJDTJ2PakzGQ0RLPk-V0FQhyM" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🛒</div>
      <div class="section-title" data-en="Supermarkets" data-pt="Supermercados" data-es="Supermercados" data-fr="Supermarchés">Supermarkets</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name" data-en="Nearest supermarket" data-pt="Supermercado mais próximo" data-es="Supermercado más cercano" data-fr="Supermarché le plus proche">Nearest supermarket</div>
        <a href="https://goo.gl/maps/RFhBsYGyd4VQPcfK6" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🚇</div>
      <div class="section-title" data-en="Getting around" data-pt="Transportes" data-es="Cómo moverse" data-fr="Se déplacer">Getting around</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name" data-en="Metro — Alvalade (Yellow Line)" data-pt="Metro — Alvalade (Linha Amarela)" data-es="Metro — Alvalade (Línea Amarilla)" data-fr="Métro — Alvalade (Ligne Jaune)">Metro — Alvalade (Yellow Line)</div>
        <div class="service-desc" data-en="~5 min walk. Connects to Marquês de Pombal, Rossio, airport and all main points." data-pt="~5 min a pé. Liga ao Marquês de Pombal, Rossio, aeroporto e todos os principais pontos." data-es="~5 min andando. Conecta con Marquês de Pombal, Rossio, aeropuerto y todos los puntos principales." data-fr="~5 min à pied. Connecte au Marquês de Pombal, Rossio, aéroport et tous les points principaux.">~5 min walk. Connects to Marquês de Pombal, Rossio, airport and all main points.</div>
        <a href="https://goo.gl/maps/6ttacDpZ64XjFSd89" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="service-item">
        <div class="service-name" data-en="Taxi / Rideshare" data-pt="Taxi / Rideshare" data-es="Taxi / VTC" data-fr="Taxi / VTC">Taxi / Rideshare</div>
        <div class="service-desc" data-en="Uber, Bolt and Free Now are all highly recommended in Lisbon — much more reliable than taxis." data-pt="Uber, Bolt e Free Now são muito recomendados em Lisboa — muito mais fiáveis do que taxis." data-es="Uber, Bolt y Free Now son muy recomendados en Lisboa — mucho más fiables que los taxis." data-fr="Uber, Bolt et Free Now sont très recommandés à Lisbonne — bien plus fiables que les taxis.">Uber, Bolt and Free Now are all highly recommended in Lisbon — much more reliable than taxis.</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🅿️</div>
      <div class="section-title" data-en="Parking" data-pt="Estacionamento" data-es="Aparcamiento" data-fr="Stationnement">Parking</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name" data-en="⚠️ No parking on Rua Alberto Oliveira!" data-pt="⚠️ Sem estacionamento na Rua Alberto Oliveira!" data-es="⚠️ ¡Sin aparcamiento en Rua Alberto Oliveira!" data-fr="⚠️ Pas de stationnement Rua Alberto Oliveira !">⚠️ No parking on Rua Alberto Oliveira!</div>
        <div class="place-desc" data-en="Resident parking only — police are very strict. Please do not park on this street." data-pt="Apenas para residentes — a polícia é implacável. Por favor, não estacione nesta rua." data-es="Solo para residentes — la policía es implacable. Por favor, no aparques en esta calle." data-fr="Stationnement réservé aux résidents — la police est stricte. Ne stationnez pas dans cette rue.">Resident parking only — police are very strict. Please do not park on this street.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Avenida da Igreja — street parking" data-pt="Avenida da Igreja — estacionamento na rua" data-es="Avenida da Igreja — aparcamiento en calle" data-fr="Avenida da Igreja — stationnement en rue">Avenida da Igreja — street parking</div>
        <div class="place-desc" data-en="€1/h · 9:00–19:00 (Mon–Fri). Free evenings and weekends!" data-pt="€1/h · 9h–19h (Seg–Sex). Gratuito à noite e fins de semana!" data-es="€1/h · 9:00–19:00 (Lun–Vie). ¡Gratuito por la noche y fines de semana!" data-fr="€1/h · 9h–19h (Lun–Ven). Gratuit le soir et le week-end !">€1/h · 9:00–19:00 (Mon–Fri). Free evenings and weekends!</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Private car park — Centro Comercial Alvalade" data-pt="Parque privado — Centro Comercial Alvalade" data-es="Aparcamiento privado — Centro Comercial Alvalade" data-fr="Parking privé — Centro Comercial Alvalade">Private car park — Centro Comercial Alvalade</div>
        <a href="https://www.google.pt/maps/place/Centro+Comercial+Alvalade" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🏪</div>
      <div class="section-title" data-en="Useful services nearby" data-pt="Serviços úteis perto" data-es="Servicios útiles cerca" data-fr="Services utiles à proximité">Useful services nearby</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Pharmacy" data-pt="Farmácia" data-es="Farmacia" data-fr="Pharmacie">Pharmacy</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Sanex</div><div class="place-rating">⭐ 4.3</div></div>
        <div class="place-desc" data-en="Pleasant pharmacy on Avenida da Igreja. Open daily including Sundays." data-pt="Farmácia agradável na Avenida da Igreja. Aberta todos os dias incluindo domingos." data-es="Farmacia agradable en Avenida da Igreja. Abierta todos los días incluido domingos." data-fr="Pharmacie agréable sur l'Avenida da Igreja. Ouverte tous les jours y compris dimanches.">Pleasant pharmacy on Avenida da Igreja. Open daily including Sundays.</div>
        <div class="place-meta" data-en="Mon–Sat 9:00–21:00 · Sun 9:00–20:00" data-pt="Seg–Sáb 9h–21h · Dom 9h–20h" data-es="Lun–Sáb 9:00–21:00 · Dom 9:00–20:00" data-fr="Lun–Sam 9h–21h · Dim 9h–20h">Mon–Sat 9:00–21:00 · Sun 9:00–20:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJn-3H36ozGQ0RflQYmuehuYA" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Barber" data-pt="Barbearia" data-es="Barbería" data-fr="Barbier">Barber</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Lisbon'Style Barbershop</div><div class="place-rating">⭐ 4.6 · 192 reviews</div></div>
        <div class="place-desc" data-en="Excellent barbers, friendly staff. Walk-ins welcome. Open daily including Sundays." data-pt="Barbeiros excelentes, equipa simpática. Walk-ins bem-vindos. Aberto todos os dias." data-es="Excelentes barberos, personal amable. Se admiten walk-ins. Abierto todos los días." data-fr="Excellents barbiers, personnel sympathique. Walk-ins acceptés. Ouvert tous les jours.">Excellent barbers, friendly staff. Walk-ins welcome. Open daily including Sundays.</div>
        <div class="place-meta" data-en="Daily 10:00–22:00" data-pt="Diário 10h–22h" data-es="Diario 10:00–22:00" data-fr="Quotidien 10h–22h">Daily 10:00–22:00</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJuSIo0FMyGQ0RcoUnr0tzuOs" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="Laundry" data-pt="Lavandaria" data-es="Lavandería" data-fr="Laverie">Laundry</p>
      <div class="place">
        <div class="place-header"><div class="place-name">Alvawash</div><div class="place-rating">⭐ 4.6 · 52 reviews</div></div>
        <div class="place-desc" data-en="Clean, well-equipped self-service laundry. Detergent included. Daily 7:00–23:00." data-pt="Lavandaria self-service limpa e bem equipada. Detergente incluído. Diário 7h–23h." data-es="Lavandería self-service limpia y bien equipada. Detergente incluido. Diario 7:00–23:00." data-fr="Laverie self-service propre et bien équipée. Lessive incluse. Quotidien 7h–23h.">Clean, well-equipped self-service laundry. Detergent included. Daily 7:00–23:00.</div>
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJOV3P9EozGQ0RiE3TeIQiJBk" target="_blank" class="map-link">📍 <span data-en="View on map" data-pt="Ver no mapa" data-es="Ver en el mapa" data-fr="Voir sur la carte">View on map</span></a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px" data-en="ATM / Cash" data-pt="Multibanco" data-es="Cajero" data-fr="Distributeur">ATM / Cash</p>
      <div class="place">
        <div class="place-name" data-en="Multibanco — Avenida da Igreja" data-pt="Multibanco — Avenida da Igreja" data-es="Cajero — Avenida da Igreja" data-fr="Distributeur — Avenida da Igreja">Multibanco — Avenida da Igreja</div>
        <div class="place-desc" data-en="Use Multibanco (MB) machines — avoid Euronet (high fees)." data-pt="Usa máquinas Multibanco (MB) — evita Euronet (taxas altas)." data-es="Usa cajeros Multibanco (MB) — evita Euronet (comisiones altas)." data-fr="Utilisez les distributeurs Multibanco (MB) — évitez Euronet (frais élevés).">Use Multibanco (MB) machines — avoid Euronet (high fees).</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🧳</div>
      <div class="section-title" data-en="Luggage storage" data-pt="Guarda-bagagem" data-es="Consigna de equipaje" data-fr="Consigne à bagages">Luggage storage</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="service-item">
        <div class="service-name">Bounce</div>
        <div class="service-desc" data-en="Storage locations nearby from €1/day. 5% discount with our link." data-pt="Locais perto a partir de €1/dia. 5% desconto." data-es="Locales cercanos desde €1/día. 5% descuento." data-fr="Lieux à proximité à partir de 1€/jour. 5% de réduction.">Storage locations nearby from €1/day. 5% discount with our link.</div>
        <a href="https://go.bounce.com/PORTOHAVEN7471817336" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
      <div class="service-item">
        <div class="service-name">LUGGit</div>
        <div class="service-desc" data-en="Collects and delivers your bags wherever and whenever. 10% discount." data-pt="Recolhe e entrega onde quiseres. 10% desconto." data-es="Recoge y entrega donde quieras. 10% descuento." data-fr="Récupère et livre vos bagages. 10% de réduction.">Collects and delivers your bags wherever and whenever. 10% discount.</div>
        <a href="https://luggit.app/partner/porto-haven" target="_blank" class="map-link">🔗 <span data-en="Book with discount" data-pt="Reservar com desconto" data-es="Reservar con descuento" data-fr="Réserver avec réduction">Book with discount</span></a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🗺️</div>
      <div class="section-title" data-en="Things to do in Lisbon" data-pt="O que visitar em Lisboa" data-es="Qué hacer en Lisboa" data-fr="À faire à Lisbonne">Things to do in Lisbon</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="place">
        <div class="place-name" data-en="Parque Eduardo VII & Avenida da Liberdade" data-pt="Parque Eduardo VII & Avenida da Liberdade" data-es="Parque Eduardo VII & Avenida da Liberdade" data-fr="Parque Eduardo VII & Avenida da Liberdade">Parque Eduardo VII & Avenida da Liberdade</div>
        <div class="place-desc" data-en="Beautiful park with panoramic views of Lisbon, leading to the grand Avenida da Liberdade." data-pt="Parque bonito com vistas panorâmicas de Lisboa, levando à grande Avenida da Liberdade." data-es="Hermoso parque con vistas panorámicas de Lisboa, que lleva a la gran Avenida da Liberdade." data-fr="Beau parc avec des vues panoramiques sur Lisbonne, menant à la grande Avenida da Liberdade.">Beautiful park with panoramic views of Lisbon, leading to the grand Avenida da Liberdade.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Alfama & São Jorge Castle" data-pt="Alfama & Castelo de São Jorge" data-es="Alfama & Castillo de San Jorge" data-fr="Alfama & Château Saint-Georges">Alfama & São Jorge Castle</div>
        <div class="place-desc" data-en="Lisbon's oldest and most atmospheric neighbourhood. Fado music, winding streets and stunning views." data-pt="O bairro mais antigo e atmosférico de Lisboa. Fado, ruelas e vistas deslumbrantes." data-es="El barrio más antiguo y atmosférico de Lisboa. Fado, calles sinuosas y vistas impresionantes." data-fr="Le quartier le plus ancien et le plus atmosphérique de Lisbonne. Fado, ruelles sinueuses et vues époustouflantes.">Lisbon's oldest and most atmospheric neighbourhood. Fado music, winding streets and stunning views.</div>
      </div>
      <div class="place">
        <div class="place-name">Belém</div>
        <div class="place-desc" data-en="Torre de Belém, Mosteiro dos Jerónimos and the original Pastéis de Belém. Essential Lisbon." data-pt="Torre de Belém, Mosteiro dos Jerónimos e os Pastéis de Belém originais. Lisboa essencial." data-es="Torre de Belém, Mosteiro dos Jerónimos y los Pastéis de Belém originales. Lisboa esencial." data-fr="Torre de Belém, Mosteiro dos Jerónimos et les Pastéis de Belém originaux. Lisbonne essentielle.">Torre de Belém, Mosteiro dos Jerónimos and the original Pastéis de Belém. Essential Lisbon.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="LX Factory" data-pt="LX Factory" data-es="LX Factory" data-fr="LX Factory">LX Factory</div>
        <div class="place-desc" data-en="Trendy market and creative hub in a former industrial complex. Especially great on Sundays." data-pt="Mercado trendy e hub criativo num complexo industrial. Especialmente ótimo aos domingos." data-es="Mercado moderno y hub creativo en un antiguo complejo industrial. Especialmente genial los domingos." data-fr="Marché tendance et hub créatif dans un ancien complexe industriel. Particulièrement bien le dimanche.">Trendy market and creative hub in a former industrial complex. Especially great on Sundays.</div>
      </div>
      <div class="place">
        <div class="place-name" data-en="Mouraria & Graça" data-pt="Mouraria & Graça" data-es="Mouraria & Graça" data-fr="Mouraria & Graça">Mouraria & Graça</div>
        <div class="place-desc" data-en="Authentic neighbourhoods with incredible miradouros (viewpoints), local restaurants and a genuine Lisbon feel." data-pt="Bairros autênticos com miradouros incríveis, restaurantes locais e o espírito genuíno de Lisboa." data-es="Barrios auténticos con miradores increíbles, restaurantes locales y ambiente genuinamente lisboeta." data-fr="Quartiers authentiques avec des miradouros incroyables, des restaurants locaux et une atmosphère genuinement lisbonaise.">Authentic neighbourhoods with incredible miradouros (viewpoints), local restaurants and a genuine Lisbon feel.</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">📋</div>
      <div class="section-title" data-en="House rules" data-pt="Regras da casa" data-es="Normas de la casa" data-fr="Règles de la maison">House rules</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="rule"><div class="rule-icon">🚭</div><span data-en="No smoking" data-pt="Proibido fumar" data-es="Prohibido fumar" data-fr="Défense de fumer">No smoking</span></div>
      <div class="rule"><div class="rule-icon">🎉</div><span data-en="No parties or events" data-pt="Sem festas ou eventos" data-es="Sin fiestas ni eventos" data-fr="Pas de fêtes ni d'événements">No parties or events</span></div>
      <div class="rule"><div class="rule-icon">🐾</div><span data-en="No pets" data-pt="Sem animais" data-es="No se admiten mascotas" data-fr="Animaux interdits">No pets</span></div>
      <div class="rule"><div class="rule-icon">🚫</div><span data-en="No external visitors" data-pt="Sem visitas externas" data-es="Sin visitas externas" data-fr="Pas de visiteurs extérieurs">No external visitors</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header" onclick="toggle(this)">
      <div class="section-icon">🆘</div>
      <div class="section-title" data-en="Emergency contacts" data-pt="Contactos de emergência" data-es="Contactos de emergencia" data-fr="Contacts d'urgence">Emergency contacts</div>
      <div class="section-chevron">›</div>
    </div>
    <div class="section-body">
      <div class="emergency-box">
        <div class="emergency-title" data-en="Emergency numbers" data-pt="Números de emergência" data-es="Números de emergencia" data-fr="Numéros d'urgence">Emergency numbers</div>
        <div class="emergency-row"><span class="emergency-label" data-en="Emergency (EU)" data-pt="Emergência" data-es="Emergencias" data-fr="Urgences">Emergency (EU)</span><span class="emergency-num">112</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Police (PSP)" data-pt="Polícia" data-es="Policía" data-fr="Police">Police (PSP)</span><span class="emergency-num">217 654 242</span></div>
        <div class="emergency-row"><span class="emergency-label" data-en="Hospital Santa Maria" data-pt="Hospital Santa Maria" data-es="Hospital Santa Maria" data-fr="Hôpital Santa Maria">Hospital Santa Maria</span><span class="emergency-num">217 805 000</span></div>
      </div>
      <p class="tip" style="margin-top:0.75rem" data-en="For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible." data-pt="Para qualquer problema, envia-nos uma mensagem pela plataforma de reserva." data-es="Para cualquier problema, envíanos un mensaje a través de tu plataforma de reserva." data-fr="Pour tout problème, envoyez-nous un message via votre plateforme de réservation.">For any issue with the apartment, please message us through your booking platform and we'll get back to you as soon as possible.</p>
    </div>
  </div>

</div>
<div class="footer">
  <p data-en="Lisbon Haven · Alvalade · We hope you have a wonderful stay!" data-pt="Lisbon Haven · Alvalade · Esperamos que tenhas uma estadia maravilhosa!" data-es="Lisbon Haven · Alvalade · ¡Esperamos que tengas una estancia maravillosa!" data-fr="Lisbon Haven · Alvalade · Nous vous souhaitons un merveilleux séjour !">Lisbon Haven · Alvalade · We hope you have a wonderful stay!</p>
</div>
<script>
function toggle(h){const b=h.nextElementSibling;const o=b.classList.contains('open');b.classList.toggle('open',!o);h.classList.toggle('open',!o)}
function setLang(l){document.querySelectorAll('[data-en]').forEach(e=>{e.textContent=e.getAttribute('data-'+l)||e.getAttribute('data-en')});const m={'en':'English','pt':'Português','es':'Español','fr':'Français'};document.querySelectorAll('.lang-btn').forEach(b=>{b.classList.toggle('active',b.textContent===m[l])})}
</script>
</body>
</html>`;



app.get('/guia-cedofeita', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(GUIDE_CEDOFEITA_HTML);
});

app.get('/guia-cedofeita-2', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(GUIDE_CEDOFEITA2_HTML);
});

app.get('/guia-cedofeita-3', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(GUIDE_CEDOFEITA3_HTML);
});

app.get('/guia-cedofeita-4', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(GUIDE_CEDOFEITA4_HTML);
});

app.get('/guia-alegria700', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(GUIDE_ALEGRIA700_HTML);
});

app.get('/guia-codecal-1', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(GUIDE_CODECAL1_HTML);
});

app.get('/guia-codecal-2', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(GUIDE_CODECAL2_HTML);
});

app.get('/guia-alvalade', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(GUIDE_ALVALADE_HTML);
});

app.get('/', (req, res) => res.json({
  status: 'online',
  service: 'Porto Haven — AI Guest Assistant',
  guides: {
    alegria93: '/guia',
    alegria700: '/guia-alegria700',
    cedofeita1: '/guia-cedofeita',
    cedofeita2: '/guia-cedofeita-2',
    cedofeita3: '/guia-cedofeita-3',
    cedofeita4: '/guia-cedofeita-4',
    codecal1: '/guia-codecal-1',
    codecal2: '/guia-codecal-2',
    alvalade: '/guia-alvalade',
  },
  timestamp: new Date().toISOString(),
}));

app.listen(PORT, () => {
  console.log(`🏠 Porto Haven AI a correr na porta ${PORT}`);
  console.log(`📖 Alegria 93: /guia`);
  console.log(`📖 Alegria 700: /guia-alegria700`);
  console.log(`📖 Cedofeita 1º: /guia-cedofeita`);
  console.log(`📖 Cedofeita 2º: /guia-cedofeita-2`);
  console.log(`📖 Cedofeita 3º: /guia-cedofeita-3`);
  console.log(`📖 Cedofeita 4º: /guia-cedofeita-4`);
  console.log(`📖 Codeçal 1º: /guia-codecal-1`);
  console.log(`📖 Codeçal 2º: /guia-codecal-2`);
  console.log(`📖 Alvalade: /guia-alvalade`);
  console.log(`🔄 Polling ativo — Alegria 93 (ID: ${APARTMENT_ID})`);
});
