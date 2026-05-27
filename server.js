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

app.get('/', (req, res) => res.json({
  status: 'online',
  service: 'Porto Haven — AI Guest Assistant',
  guides: {
    alegria93: '/guia',
    cedofeita1: '/guia-cedofeita',
    cedofeita2: '/guia-cedofeita-2',
    cedofeita3: '/guia-cedofeita-3',
    cedofeita4: '/guia-cedofeita-4',
  },
  timestamp: new Date().toISOString(),
}));

app.listen(PORT, () => {
  console.log(`🏠 Porto Haven AI a correr na porta ${PORT}`);
  console.log(`📖 Guia Alegria 93: /guia`);
  console.log(`📖 Guia Cedofeita 1º: /guia-cedofeita`);
  console.log(`📖 Guia Cedofeita 2º: /guia-cedofeita-2`);
  console.log(`📖 Guia Cedofeita 3º: /guia-cedofeita-3`);
  console.log(`📖 Guia Cedofeita 4º: /guia-cedofeita-4`);
  console.log(`🔄 Polling ativo — Alegria 93 (ID: ${APARTMENT_ID})`);
});
