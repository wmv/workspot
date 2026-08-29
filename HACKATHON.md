# WorkSpot — Cursor Hackathon, Luanda

Nome de trabalho. O nome final não deve prender-nos a cafés — raízes
preferidas: *plug / spot / session / work / meet*.

Criado no **[Cursor hackathon em Luanda](https://cursor.com)**. A construir
em aberto desde o primeiro dia.

Português e inglês são línguas de primeira classe. O `pt` vem primeiro.

---

## Português

### A pergunta

**Onde é que consigo trabalhar a sério, agora — sozinho ou com um grupo
pequeno?**

Não é o Yelp dos cafés. Não é uma rede social. É um **motor de decisão**
assente em dados de *trabalhabilidade* (tomadas, Wi‑Fi, ruído, lugares,
tolerância a grupos) e em pulsos da comunidade de 10 segundos.

### A frase

> Uma app que ajuda a encontrar sítios mesmo bons para trabalhar e a
> combinar sessões em grupo, com sinais rápidos da comunidade: tomada,
> lugar, ruído, ambiente certo.

### O que apostamos

1. **Inteligência de trabalho vence estrelas genéricas.** "Bom para
   chamadas antes do meio-dia" vale mais do que "4,3 estrelas".
2. **Contribuir tem de levar ≤10 segundos.** Toques, não textos. Se for
   lento, os dados morrem.
3. **O hábito diário é o solo** ("encontra-me um sítio agora"). O
   planeamento de grupo é a história seguinte.
4. **Um bairro denso, semeado à mão.** Densidade ganha a cobertura.
5. **Português é de primeira classe.** `pt` e `en` saem juntos; no bairro
   de lançamento o predefinido é `pt`.

### O que o MVP tem de provar

> As pessoas encontram um sítio melhor para trabalhar, mais depressa do
> que no Google Maps.

Se isto falhar, o resto da visão não importa.

**No P0:** mapa/lista ao perto, filtros em chips (tomadas, sossego, aberto
agora, chamadas, Wi‑Fi, estacionamento, grupo de X), página do sítio
(factos estáveis vs. condições recentes), check-in + pulso de 4–6 toques,
ranking por *encaixe* — não por popularidade.

**De propósito fora:** feed social, reservas, descoberta de comida,
painéis para donos, IA colada, várias cidades, qualquer monetização.

### Stack (mínima, funcional)

PWA mobile-first num **Cloudflare Worker** (Hono + assets). **Neon
Postgres + PostGIS** via **Hyperdrive**. **R2** para fotos, **KV** para
sessões, **Turnstile** nos pulsos. Mapas: MapLibre + OpenFreeMap. Conta
só para check-in / gravar; explorar e votar numa lista partilhada não
exige conta.

### Estado

Fase de especificação. Ainda sem código de produto. O próximo passo é um
spike: Explore + sítios semeados + troca `pt`/`en`.

---

## English

### The question

**Where can I actually get work done right now — alone or with a small
group?**

Not Yelp for coffee shops. Not a social network. A **decision engine**
built on workability data (plugs, Wi‑Fi, noise, seating, group tolerance)
and 10-second community pulses.

### The one-liner

> An app that helps people find genuinely work-friendly venues and
> coordinate group work sessions using fast, community-powered signals
> like plug access, noise, seating, and suitability.

### Core bets

1. **Workability beats generic stars.** "Good for calls before noon"
   beats "4.3 stars".
2. **Contribution must take ≤10 seconds.** Taps, not essays. If it's
   slow, the data dies.
3. **Solo "find me a spot now" is the daily habit.** Group planning is
   the expansion story.
4. **One dense neighborhood, seeded by hand.** Density beats coverage.
5. **Portuguese is first-class.** `pt` and `en` ship together; the launch
   neighborhood defaults to `pt`.

### What the MVP must prove

> Users can reliably find a better place to work, faster than with Google
> Maps.

If this fails, nothing else in the vision matters.

**P0:** nearby map/list, chip filters (plugs, quiet, open now, calls,
Wi‑Fi, parking, group of X), venue page (stable facts vs. recent
conditions), check-in + 4–6 tap pulse, ranking by *fit* — not popularity.

**Explicitly out:** social feed, bookings, food discovery, owner
dashboards, bolted-on AI, multi-city, any monetization.

### Stack (minimal, functional)

Mobile-first PWA on a **Cloudflare Worker** (Hono + assets). **Neon
Postgres + PostGIS** via **Hyperdrive**. **R2** for photos, **KV** for
sessions, **Turnstile** on pulses. Maps: MapLibre + OpenFreeMap. Accounts
only for check-in / saves; browse and shared-list voting stay logged-out.

### Status

Specification phase. No product code yet. Next step: Explore spike +
seeded venues + `pt`/`en` switch.
