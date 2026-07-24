# Faz 3 Roadmap — Post-MVP

CEO kararı (2026-07-24): "Bugünkü operasyon mühürlendi." Bu doküman,
`artifacts/openclaw-architecture.md`'de tespit edilen 3 boşluktan MVP
kapsamı dışında bırakılan maddeleri, gerekçeleriyle birlikte kaydeder.
V5 Mainnet'te değişmeden kalıyor — burada listelenen hiçbir madde
şu an aktif geliştirme altında değil.

## Karar özeti

| # | Boşluk | MVP kararı |
|---|---|---|
| 1 | AgentScope (ince yetkilendirme) | **Faz 3 — Post-MVP** |
| 2 | Batch settlement (`executeIntentBatch`) | **Faz 3 — Post-MVP** |
| 3 | ClawScore / WillDividendTracker (`0xe117...`) bağımlılığı | **Çözüldü — off-chain, MVP kapsamında** (bkz. openclaw-architecture.md §4) |

---

## Faz 3.1 — AgentScope (ince-taneli agent yetkilendirmesi)

**Problem:** `WillTokenV5.isAgent` ikili (bool) — kayıtlı herhangi bir
ajan, herhangi bir imzalayanın imzaladığı `executeIntent` çağrısını
sınırsız değerde çalıştırabilir. Bir ajan anahtarı ele geçirilirse,
blast radius'u sınırlayan hiçbir kontrat-seviyeli mekanizma yok
(mevcut savunma: guardian'ların `revokeAgent` ile onu çıkarması —
2 günlük timelock'a tabi).

**Tasarım referansı:** `artifacts/ajan1-WillTokenV6.sol` (CANCELLED
olarak işaretli, derlenmedi/test edilmedi) bir `AgentScope` struct'ı
(günlük harcama limiti + fonksiyon-seçici kısıtlaması) önermişti.
Faz 3'e geçildiğinde bu dosya başlangıç noktası olarak kullanılabilir
ama **sıfırdan CTO güvenlik incelemesinden geçmeli** — iptal edildiği
için hiç derlenip test edilmedi.

**Not:** AgentScope, agent-seviyeli bir throttle — acpx'in vaat ettiği
(agent, principal) çiftine özel delegasyon modelini TAM olarak
karşılamıyor (bkz. openclaw-architecture.md §2). Bu daha büyük, çözümü
daha zor bir problem olarak ayrıca değerlendirilmeli.

**Ön koşullar:** V6 tasarımının yeniden gözden geçirilmesi, tam Red
Team incelemesi (önceki 4 revizyon turunda WillTokenV1-V5'e uygulanan
seviyede), Anvil'de kapsamlı test, ancak sonra mainnet'e dokunma kararı.

---

## Faz 3.2 — Batch settlement (`executeIntentBatch`)

**Problem:** Manifesto v3'ün öngördüğü "off-chain müzakere, periyodik
toplu on-chain settlement" akışı, mevcut `executeIntent`'in tek-intent
işlemesiyle gas-verimsiz oluyor (N intent = N ayrı tx).

**Seçenekler (Faz 3'te karar verilecek):**
- (a) Aynı ajan bir transaction'da birden fazla `executeIntent` çağırır
  — basit, kontrat değişikliği gerektirmez, ama yine de N ayrı çağrı.
- (b) Yeni `executeIntentBatch(AgentIntent[] calldata intents, bytes[] calldata signatures)`
  fonksiyonu — gerçek gas tasarrufu, ama yeni saldırı yüzeyi: kısmi
  başarısızlık davranışı (bir intent revert ederse tümü mü geri alınır
  yoksa atlanır mı?), tek bir pahalı tx'te reentrancy/sıralama riskleri
  yeniden değerlendirilmeli.

**Ön koşullar:** (a) vs (b) kararı, (b) seçilirse tam CTO güvenlik
incelemesi (kısmi başarısızlık semantiği özellikle).

---

## Diğer açık sorular (bu turda çözülmedi, gelecekte netleşmeli)

1. **ClawScore hesaplama yeri:** on-chain mi (gas maliyeti), imzalı
   off-chain oracle mı (güven varsayımı)? `ajan6-ClawScoreV1.md`'de
   ilk açık soru olarak işaretlenmişti, hâlâ açık.
2. **WillTokenV5 ↔ WillDividendTracker kullanıcı kimlik varsayımı:**
   İki kontrat aynı cüzdan adresini "aynı kullanıcı" olarak paylaştığı
   varsayılıyor — bu hiç doğrulanmadı. H bileşeni artık sadece
   WillTokenV5'ten geliyor olsa da, WillDividendTracker projenin
   başka yerlerinde (dividend/faction UI) hâlâ aktif kullanılıyor.
3. **imsg/acpx/wacli/gogcli/clawsweeper/mcporter/openclaw-windows-node:**
   Manifesto v3 "yedi repo analiz edildi" diyor ama bu ortamda hiçbiri
   gerçek kod olarak bulunamadı (aranıp doğrulandı). Faz 3 planlaması
   öncesi netleşmesi gereken temel soru: bunlar var olan, erişilebilir
   repolar mı, yoksa sıfırdan mı inşa edilecek? Bu, openclaw-architecture.md'nin
   tüm varsayımsal temelini etkiliyor.
4. **Faction Score (F) veri kaynağı:** MVP'de veri yok/0. Faz 3'te
   çözülecekse iki yol var: (i) WillDividendTracker'dan salt-okunur
   entegrasyon (kontrat değişikliği yok, ama 0xe117 bağımlılığı
   kısmen geri döner), (ii) V6-tarzı native tracking (AgentScope ile
   aynı ön koşullar — tam güvenlik incelemesi gerektirir).

---

## İlkeler (Faz 3 çalışmasına başlarken hatırlanacak)

- V5, Mainnet'te aktif kontrat. Hiçbir Faz 3 maddesi, tam bir CTO
  güvenlik incelemesi ve CEO onayı olmadan mainnet'e dokunmaz.
- `cast send --create` zorunlu (forge script chain 4663'te çalışmıyor).
- Private key hiçbir zaman dosyaya yazılmaz.
- Yeni bir kontrat versiyonu her zaman: (1) yerelde derlenip test
  edilir, (2) Red Team incelemesinden geçer, (3) CEO onayı alır,
  (4) ancak o zaman testnet'e, sonra mainnet'e taşınır — bu sıra hiç
  atlanmaz.
