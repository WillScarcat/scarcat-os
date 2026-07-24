# OpenClaw Arsenal Eşleştirmesi — 9 Ajan × 6 Araç

## ⚠️ DÜRÜSTLÜK UYARISI — okumadan önce

Bu doküman **spekülatif**. Aranıp doğrulandı (2026-07-24): `Crabfleet`,
`Lobster`, `discrawl`, `gitcrawl`, `telecrawl`, `ClickClack` isimlerinin
hiçbiri bu ortamda — ne gerçek bir repo/kod olarak, ne de
Manifesto/ECON_MODEL/QUANT_REPORT gibi mevcut proje belgelerinde bir
açıklama olarak — bulunamadı. CEO direktifinde sadece çıplak isimler
geçiyor, ne yaptıklarına dair tek satır bile yok (OpenClaw'ın `imsg`/
`acpx` gibi bileşenleri en azından Manifesto v3'te birer cümlelik
tanıma sahipti — bunlar onu bile yok).

Aşağıdaki eşleştirme **sadece isim semantiğinden ve her ajanın zaten
bilinen rolünden** çıkarım yapıyor. Bu bir mimari karar dokümanı değil,
"eğer isimler ima ettiği gibiyse, muhtemelen böyle olur" seviyesinde bir
başlangıç noktası. **Herhangi bir gerçek entegrasyon çalışmasına
başlamadan önce CEO/Baş Stratejist'ten bu 6 aracın gerçek ne olduğuna
dair bir açıklama istenmeli.**

---

## Çıkarım güven seviyeleri

| Araç | Çıkarım | Güven |
|---|---|---|
| `gitcrawl` | Git/GitHub repo aktivite tarayıcısı (commit, PR, issue) | Yüksek — isim çok açık |
| `discrawl` | Discord aktivite tarayıcısı (sunucu/kanal/mesaj) | Yüksek — isim çok açık |
| `telecrawl` | Telegram aktivite tarayıcısı (kanal/grup mesajları) | Yüksek — isim çok açık |
| `Crabfleet` | Tarayıcı/worker "filosu"nu yöneten altyapı katmanı (gitcrawl/discrawl/telecrawl'ı çalıştıran orkestrasyon) — Manifesto v3'teki `gogcli`ye kavramsal olarak benzer | Orta — "fleet" kelimesinden çıkarım, doğrulanmadı |
| `Lobster` | Whale/wash-trading veri analiz aracı (SCARCAT_QUANT_REPORT.md'deki vol/liq analizi ile aynı aile) | Düşük — sadece tema (crustacean) uyumu, işlevsel bir ipucu yok |
| `ClickClack` | **Çıkarım yapılamadı** | Yok — isim hiçbir anlamsal ipucu vermiyor |

---

## Eşleştirme (9 ajan × çıkarımsal araç kullanımı)

| Ajan | Rol | Muhtemel araç(lar) | Gerekçe |
|---|---|---|---|
| Ajan-1 | Smart Contract & MEV Lead | `Lobster` (?) | MEV/wash-trading tespiti Ajan-1'in kapsamına giriyor (clawsweeper ile birlikte) — ama Lobster'ın gerçekte bunu yapıp yapmadığı doğrulanmadı |
| Ajan-2 | Interface & ClawHub | — | İsimlerden hiçbiri arayüz/frontend ile açık bir bağ kurmuyor |
| Ajan-3 | Stealth Motion Designer | — | Aynı şekilde bağ yok |
| Ajan-4 | Node & Infrastructure | `Crabfleet` | "Fleet" = worker/node orkestrasyonu, Ajan-4'ün rolüyle en dogal eşleşme |
| Ajan-5 | ClawHub AI Model Engineer | `gitcrawl`, `Lobster` (?) | Model geliştirme için repo aktivitesi (gitcrawl) + quant veri (Lobster) mantıklı ama doğrulanmadı |
| Ajan-6 | A2A Monetization Strategist | `Lobster` (?) | Whale/veri satışı (SCARCAT_ECON_MODEL.md §8.2 "A2A Veri Fiyatlaması") Lobster'ın çıktısına bağımlı olabilir |
| Ajan-7 | Ecosystem & Partnerships VP | `telecrawl`, `discrawl` | Topluluk/partner izleme — Telegram kripto projelerinde birincil kanal olduğu için telecrawl öne çıkıyor |
| Ajan-8 | Autonomous Swarm & Social-Fi | `discrawl`, `telecrawl` | Sosyal katman + copy-trading (bkz. openclaw-architecture.md §5) — topluluk sinyali için ikisi de mantıklı |
| Ajan-9 | Swarm Commander | `Crabfleet`, `gitcrawl` | Orkestrasyon + swarm'ın kendi geliştirme aktivitesini izleme |

`ClickClack`: hiçbir ajana atanmadı — isimden hiçbir işlevsel çıkarım
yapılamadı. CEO netleştirmesi olmadan spekülasyon yapmak yanıltıcı
olur.

---

## OpenClaw mimarisiyle ilişki

`openclaw-architecture.md`'deki katmanlarla karşılaştırıldığında:

- `gitcrawl`/`discrawl`/`telecrawl` → **veri girişi** katmanı, aynı rolü
  Manifesto v3'ün `imsg`'i (agent-to-agent mesajlaşma) değil, daha çok
  **crawler-bridge.ts**'in üstlendiği rolü oynuyor: dış dünyadan (git/
  Discord/Telegram) sinyal toplayıp `OpenClawBridge`'e A2A talebi olarak
  enjekte etmek. `artifacts/crawler-bridge.ts` bunun için genel bir
  `CrawlerDataSource` arayüzü + test edilebilir bir mock implementasyonu
  sağlıyor — gerçek gitcrawl/discrawl ortaya çıktığında sadece bu
  arayüzü implemente etmek yeterli olmalı.
- `Crabfleet` → muhtemelen bu crawler'ların ÇALIŞTIRILDIĞI altyapı;
  `swarm-boot.ts`'in "9 ajana test cüzdanı + izleme" rolüyle kavramsal
  olarak komşu ama aynı şey değil.
- `Lobster` → eğer gerçekten quant/whale analiz aracıysa, ClawScore'un
  gelecekte (Faz 3) eklenebilecek bir "Agent Score" veya risk-sinyali
  bileşenine girdi olabilir — ama bu tamamen spekülasyon, bkz.
  phase3-roadmap.md madde 4.

## Sonraki adım

Bu doküman **mimari karar için kullanılmamalı**. Önerilen adım: CEO/Baş
Stratejist'ten her 6 araç için 1-2 cümlelik gerçek açıklama istensin
(Manifesto v3'ün `imsg`/`acpx`/vb. için yaptığı gibi) — o zaman bu
eşleştirme gerçek bir mimari karara dönüştürülebilir.
