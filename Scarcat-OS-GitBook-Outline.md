# Scarcat OS — Yatırımcı GitBook İskeleti (Faz 4 Taslağı)

DRAFT — bu bir GitBook sayfa yapısı iskeleti, dolu içerik değil. Her
bölüm 1-2 cümlelik özet + hangi mevcut kaynaktan besleneceğini
gösteriyor.

## Kaynak notu (dürüstlük)

Direktif "Day 1 raporu" temel alınmasını istedi — bu ortamda böyle
adlandırılmış ayrı bir dosya bulunamadı (arandı: will-dapp/design/,
scarcat/, scarcat-os/). Bunun yerine "Day 1" iki gerçek kaynaktan
oluşturuldu: (1) `artifacts/openclaw-architecture.md` (mimari), (2)
bugünün gerçek `DISPATCH.md` geçmişi (WillTokenV5 v1→v5, 4 Red Team
turu + 12/12 test, Anvil deploy, OpenClaw node, swarm boot, monitor,
social-fi webhook, willdapp.com entegrasyonu — hepsi bugün, tek
oturumda, gerçekten yazıldı ve doğrulandı). Aşağıdaki "Gün 1" bölümü bu
gerçek geçmişi özetliyor, uydurma bir rapora atıf yapmıyor.

---

## SUMMARY (GitBook sayfa ağacı)

```
* Giriş
  * Scarcat OS Nedir
  * Neden Agentic OS

* Vizyon
  * Manifesto Özeti (Manifesto v1→v3 sentezi)
  * OpenClaw Entegrasyonu

* Ürün
  * $WILL Token (WillTokenV5)
  * Claw Score
  * A2A Ekonomisi

* Teknik Mimari
  * On-chain Katman
  * Off-chain Katman (OpenClaw Node + Swarm)
  * Sosyal Katman

* Gün 1 — Ne İnşa Edildi
  * Kontrat: WillTokenV5
  * Altyapı: OpenClaw Node + Swarm Boot
  * Arayüz: Scarcat OS Komuta Merkezi

* Yol Haritası
  * Faz 3 — Tamamlanan
  * Faz 4 — Devam Eden
  * Faz 5 (Post-MVP) — Açık Maddeler

* Tokenomics
  * Arz ve Dağılım
  * Tier Sistemi
  * Vergi/Temettü Modeli

* Ekip / Swarm Yapısı
  * 9 Ajan Sistemi
  * AI CTO Operasyon Modeli

* Güvenlik
  * Guardian Multisig
  * Red Team Süreci
  * Bilinen Sınırlamalar (dürüstçe)

* Ek
  * Sözlük
  * Kaynaklar
```

---

## Bölüm detayları

### Giriş

**Scarcat OS Nedir** — 1 paragraf: $WILL etrafında inşa edilen,
AI ajanlarının birincil aktör olduğu bir "Agentic OS" — kaynak:
Manifesto v3 açılış cümlesi ("DApps serve humans" → "AI agents live and
trade autonomously").

**Neden Agentic OS** — memecoin kategorisinden farklılaşma anlatısı.
*Kaynak gerekli: henüz yazılmadı, Ajan-7'nin pazarlama girdisi lazım.*

### Vizyon

**Manifesto Özeti** — `~/dev/will-dapp/design/SCARCAT_MANIFESTO_V3.md`
sentezi (OpenClaw entegrasyonu, ClawHub stratejisi, DePIN katmanı, A2A
ekonomisi, 8 rolün OpenClaw-native mutasyonu).

**OpenClaw Entegrasyonu** — `artifacts/openclaw-architecture.md`
doğrudan kaynak. **Dürüstlük notu bu bölüme MUTLAKA taşınmalı**:
imsg/acpx/wacli/gogcli/clawsweeper/mcporter/openclaw-windows-node bu
ortamda gerçek kod olarak doğrulanamadı — yatırımcı materyalinde
"planlanan" ile "inşa edilmiş" arasındaki fark net tutulmalı, aksi
"vaporware" riski doğurur.

### Ürün

**$WILL Token** — WillTokenV5.sol: agent-native, EIP-712 intent tabanlı,
guardian multisig + timelock + round mekanizması. Kaynak:
`artifacts/ajan1-WillTokenV5.sol` + `DEPLOYMENT_LOG.md`
(`0xd69c454eCf09eE8294e69231e0727e55F59E42D1`, testnet — **yatırımcıya
sunulmadan önce zincir üzerinde bağımsız doğrulanmalı**, bkz. Güvenlik
bölümü).

**Claw Score** — `SCARCAT_ECON_MODEL.md §7` formülü
(0.35H+0.25T+0.20C+0.15F+0.05A), `artifacts/ajan6-ClawScore.ts`
implementasyonu, dokümandaki 3 örnekle sayısal doğrulandı.

**A2A Ekonomisi** — Manifesto v3 A2A akışı + `openclaw-architecture.md
§3`. *Açık madde: fee modeli henüz WillTokenV5'e bağlanmadı (bkz.
phase3-roadmap.md) — bu, "canlı gelir modeli" olarak sunulmamalı,
"tasarlanmış, entegrasyonu bekliyor" olarak sunulmalı.*

### Teknik Mimari

Üç alt bölüm `openclaw-architecture.md`'nin katman diyagramını
doğrudan yansıtmalı (mermaid diyagramı GitBook'a taşınabilir).
**Sosyal Katman** alt bölümü için ek kaynak: bu turda eklenen
`artifacts/social-fi-webhook.ts` (X/Telegram webhook alımı,
CRC handshake + secret-token doğrulaması test edildi) ve
`artifacts/crawler-bridge.ts`.

### Gün 1 — Ne İnşa Edildi

Bu bölüm, uydurma bir "Day 1 raporu"na değil, bugünün gerçek
DISPATCH.md kayıtlarına dayanıyor. Somut, doğrulanmış maddeler:

- WillTokenV5.sol: 4 Red Team revizyon turu (v1→v5), 12/12 otomatik
  test PASS (executeIntent, pause/unpause round-tekrar regresyonu,
  burnLP, imza malleability dahil)
- Anvil'de uçtan uca deploy + guardian/agent akışı doğrulandı
- `openclaw-node.ts`: EIP-712 imza şeması gerçek kontrata karşı
  doğrulandı (viem imzası → on-chain kabul → bakiye transferi)
- `swarm-boot.ts`: 9 ajan test cüzdanı + canlı on-chain izleme,
  uçtan uca doğrulandı
- `scarcat-monitor.tsx`: willdapp.com'a entegre edildi, `/scarcat-os`
  rotası gerçek `next build` ile üretildi (bugün, bu turda)
- `social-fi-webhook.ts`: X CRC handshake + Telegram webhook, protokole
  uygun sentetik payload'larla doğrulandı

*Not: "testnet'te deploy edildi" ifadesi CEO direktifiyle bildirildi,
AI CTO tarafından bağımsız zincir doğrulaması yapılamadı (RPC erişimi
yok) — bu materyal yatırımcıya gitmeden önce gerçek bir explorer
linkiyle doğrulanmalı.*

### Yol Haritası

Faz 3 (tamamlanan) / Faz 4 (bu tur: willdapp entegrasyonu, sosyal
webhook, bu doküman) / Faz 5 açık maddeleri doğrudan
`artifacts/phase3-roadmap.md`'den alınmalı (AgentScope, batch
settlement, ClawScore hesaplama yeri, WillTokenV5↔WillDividendTracker
kimlik varsayımı, OpenClaw repolarının gerçekliği).

### Tokenomics

`SCARCAT_ECON_MODEL.md` doğrudan kaynak (arz dağılımı, tier sistemi,
dinamik vergi formülü). *Not: WillTokenV5, ECON_MODEL'in referans
aldığı WillDividendTracker'dan mimari olarak bağımsız — bu ikisinin
yatırımcıya nasıl tek bir hikaye olarak anlatılacağı netleşmeli (bkz.
phase3-roadmap.md madde 2).*

### Ekip / Swarm Yapısı

9 ajan sistemi (`status/SWARM_STATUS.md` rol tablosu) + AI CTO
operasyon modeli (CEO → AI CTO → Ajan-9 → Ajan 1-8, dispatch/CLAUDE.md
hiyerarşisi). Bu bölüm "insan ekip" beklentisiyle karıştırılmamalı —
yatırımcıya operasyon modelinin AI-ajan-tabanlı olduğu açıkça
anlatılmalı, gizlenmemeli.

### Güvenlik

- Guardian multisig: 2/3 eşik, biri (Baş Stratejist) CEO'dan bağımsız
  — bkz. CTO güvenlik notu (2026-07-24, deploy script turu).
- Red Team süreci: v1→v5 arası 12 bulgu (kritik+orta+düşük) kapatıldı,
  her turun kaydı DISPATCH.md'de.
- Bilinen sınırlamalar (dürüstçe listelenmeli): kontrat bağımsız audit
  edilmedi, AgentScope/batch settlement Faz 3'e ertelendi, OpenClaw
  off-chain bileşenlerinin çoğu henüz inşa edilmedi.

### Ek

Sözlük (ClawScore, guardian, intent, tier vb.) + kaynak listesi (tüm
`artifacts/*.md` ve `design/*.md` dosyalarına referans).

---

## Sonraki adım

Bu iskelet CEO/Ajan-7 tarafından onaylandıktan sonra her bölüm ayrı
GitBook sayfalarına (`.md` dosyaları + `SUMMARY.md`) bölünmeli. Şu an
hiçbir bölümün tam metni yazılmadı — bu bilinçli bir kapsam sınırı
(direktif "iskelet" istedi, dolu içerik değil).
