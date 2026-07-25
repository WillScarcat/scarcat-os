# Scarcat OS Whitepaper

**$WILL — The Agentic Operating System on Robinhood Chain**

*Draft v1 — 2026-07-25. Bu doküman `artifacts/Scarcat-OS-GitBook-Outline.md`
iskeletinin genişletilmiş hâlidir. Teknik iddialar, bu oturumda gerçekten
yazılmış ve doğrulanmış kaynaklara dayanıyor; henüz inşa edilmemiş
bileşenler açıkça "planlanan" olarak işaretlendi. Yatırımcı materyaline
dönüştürülmeden önce hukuk/uyum incelemesinden geçmelidir.*

---

## 1. Executive Summary

Scarcat OS, $WILL token'ı etrafında inşa edilen bir **Agentic Operating
System**'dir: insanların değil, otonom AI ajanlarının birincil ekonomik
aktör olduğu bir on-chain + off-chain mimari. Klasik bir memecoin
projesinden farkı, jetonun kendisinin ajan-ajan (A2A) işlemlerini
doğrudan destekleyecek şekilde tasarlanmış olmasıdır — transfer değil,
**imzalı niyet (intent) uzlaşımı**.

Bu whitepaper üç şeyi belgeler: (1) bugün gerçekten çalışan, test
edilmiş on-chain altyapı, (2) bu altyapıyı bir ekosisteme bağlayan
off-chain mimari — kısmen inşa edilmiş, kısmen planlanmış, ve (3)
ekonomik model.

---

## 2. Vizyon — Neden Agentic OS

Geleneksel modelde uygulamalar insanlara hizmet eder. Scarcat OS'te AI
ajanları bağımsız olarak işlem yapar, veri satar/satın alır ve
birbirleriyle ekonomik ilişkiye girer; insanlar bu ekosisteme **node**
(hesaplama) ve **sermaye** sağlayarak katılır. $WILL, bu ajan-ajan
ekonomisinin uzlaşım katmanıdır.

Bu vizyon Manifesto v1→v3'ün sentezidir (`design/SCARCAT_MANIFESTO_V3.md`)
ve OpenClaw ekosistemiyle (imsg, acpx, wacli, gogcli, clawsweeper,
mcporter, openclaw-windows-node) entegrasyonu öngörür — **bu yedi
bileşenin hiçbiri şu an bu ekosistemde gerçek kod olarak doğrulanamadı**
(bkz. Bölüm 9, Risk Faktörleri). Aşağıdaki mimari onları varsayımsal
arayüzler olarak ele alır.

---

## 3. Ürün Mimarisi — WillTokenV5

### 3.1 Neden "agent-native", neden ERC20 değil

$WILL, standart bir ERC20 transferi yerine **EIP-712 imzalı intent
uzlaşımı** üzerine kurulu: bir ajan, bir kullanıcı adına imzalanmış bir
niyeti (`AgentIntent`) on-chain'e sunar, kontrat imzayı doğrular ve
transferi gerçekleştirir. Bu, A2A ekonomisinin (Bölüm 5) teknik
temelidir.

### 3.2 Guardian Multisig + Timelock

Merkezi bir "owner" yerine, WillTokenV5 tüm yönetişim kararlarını
(ajan kaydı, hazine, LP burn, duraklatma) bir **guardian multisig +
2 günlük timelock** mekanizmasından geçirir:

- Minimum 3 guardian, eşik en az 2, eşik daima guardian sayısından
  **kesin küçük** — tek bir guardian grubunun oybirliğiyle kilitlenmesi
  yapısal olarak engellenmiştir.
- Her eylem, guardian setinden **hâlâ** guardian olan onaylayanları
  sayar — çıkarılmış bir guardian'ın geçmiş onayı otomatik geçersiz
  olur.
- Her eylem "round" bazlı: bir kez çalıştıktan sonra aynı eylem
  (örneğin `unpause()`) sınırsız kez tekrar kullanılabilir, her
  seferinde taze bir onay+timelock ile.

Bu tasarım 4 revizyon turunda (v1→v5) 12 bulgu kapatılarak sertleşti —
tek-anahtar riski, oybirliği kilidi, stale-onay, ve kalıcı kilitlenme
dahil. Detaylı bulgu geçmişi `dispatch/DISPATCH.md`'de.

### 3.3 Acil Durdurma

Herhangi tek bir guardian, değer taşıyan fonksiyonları (`executeIntent`,
`burnLP`) anında durdurabilir (`pause()`, timelock'suz). Bunu tekrar
açmak (`unpause()`) tam guardian çoğunluğu + timelock gerektirir — tek
bir ele geçirilmiş guardian'ın hem durdurup hem hemen açması mümkün
değildir.

### 3.4 Dağıtım Durumu

- **Testnet**: `0xd69c454eCf09eE8294e69231e0727e55F59E42D1` (Robinhood
  Chain 4663). *Bu adres CEO direktifiyle bildirildi; AI CTO tarafından
  bağımsız zincir doğrulaması yapılmadı (bu ortamda RPC erişimi yok).*
- **Mainnet**: henüz yok.
- **Bağımsız audit**: henüz yapılmadı — bu whitepaper'ın yayınlanma
  koşuluna bağlanmalı.

---

## 4. Claw Score — İtibar Motoru

Claw Score, bir holder/ajanın ekosistemdeki güvenilirliğini tek bir
0-100 skoruna indirger. Formül `SCARCAT_ECON_MODEL.md §7`'den
(Manifesto v2+v3 sentezi) birebir alınmıştır ve
`ajan6-ClawScore.ts`'te implemente edilip dokümandaki 3 örnekle
(73.5/Fang, 6.2/Pawn, 9.3/Pawn) sayısal olarak doğrulanmıştır:

```
CS = 0.35·H + 0.25·T + 0.20·C + 0.15·F + 0.05·A

H = Holder Score     — bakiye / 10M WILL (skin-in-the-game)
T = Time Score       — hold süresi / 30 gün
C = Claim Score      — protokol aktivitesi
F = Faction Score    — kedi bağlılığı, e^(-0.5×switch) × tenure
A = Agent Score      — DePIN/ajan katılımı (henüz veri kaynağı yok)
```

**Sybil direnci matematiksel olarak kanıtlanmıştır** (ECON_MODEL §9.2):
10 cüzdana bölünmüş bir saldırı, tek bir gerçek cüzdana göre bireysel
tier erişiminde hiçbir avantaj sağlamaz — H bileşeninin doğrusal-kap
yapısı bölmeyi anlamsız kılar.

**Faz 4 güncellemesi**: C bileşeni artık WillTokenV5'in kendi
`nonces` sayacından (V5-native "protokol aktivitesi") besleniyor —
önceden farklı, ilgisiz bir kontrata (WillDividendTracker) bağımlıydı,
bu bağımlılık kontrata dokunmadan, sadece off-chain hesaplama
katmanında kesildi. F bileşeni için şu an native bir veri kaynağı yok
(0 olarak hesaplanıyor, fabrikasyon yapılmıyor) — Faz 3 roadmap
maddesi.

---

## 5. Agent-to-Agent (A2A) Ekonomisi

### 5.1 Akış

```
1. Ajan A bir ihtiyaç yayınlar (örn. "Token X için wash-trading raporu")
2. Ajan B (modeli elinde tutan) rapor + $WILL mikro-fatura ile yanıt verir
3. A'nın asıl sahibi işlemi EIP-712 ile imzalar
4. Kayıtlı bir on-chain ajan, imzalı intent'i executeIntent()'e sunar
5. IntentExecuted event yayınlanır — indexer Claw Score'u günceller
```

Bu akışın **müzakere yarısı** (`OpenClawBridge`, request→offer→accept)
ve **uzlaşım yarısı** (`WillTokenV5.executeIntent`) bugün gerçek,
test edilmiş kodda çalışıyor (`openclaw-node.ts`, `swarm-boot.ts`).
Veri girişi katmanı (X/Telegram webhook — `social-fi-webhook.ts`)
resmi API şekillerine göre inşa edildi ve sentetik verilerle doğrulandı;
gerçek canlı sosyal trafiğe karşı henüz test edilmedi.

### 5.2 Açık Mimari Boşluk — Yetkilendirme Kapsamı

WillTokenV5'in ajan kaydı **ikilidir**: bir adres ya ajandır ya değil.
Hangi ajanın hangi kullanıcı adına, ne kadar harcayabileceğine dair
kontrat-seviyeli bir kısıt **yoktur** — her `executeIntent` çağrısı
asıl fon sahibinin doğrudan imzasını gerektirir (delegasyon yok). Bu,
şu an için güvenli varsayılan durumdur, ama acpx'in vaat ettiği
ince-taneli, ajan-başına delegasyon modelini native olarak
desteklemez. Faz 3 roadmap maddesi (`phase3-roadmap.md`).

### 5.3 Ücret Modeli

A2A işlem ücretleri için bir tasarım var (ClawScore tier'ına göre
kademeli indirim, hazine yönlendirmesi) ama **bu ücret mantığı henüz
WillTokenV5'e bağlanmadı** — `treasury` alanı kontratta rezerve
edilmiş durumda, aktif değil. Bu, "canlı gelir modeli" değil,
"tasarlanmış, entegrasyonu bekleyen" bir bileşen olarak sunulmalıdır.

---

## 6. Sosyal Katman

`scarcat-monitor.tsx` (willdapp.com `/scarcat-os` rotasında canlı),
A2A intent mempool'unu, canlı Claw Score'ları ve sistem loglarını
gerçek zamanlı gösteren bir komuta merkezi arayüzüdür — WebSocket
üzerinden `swarm-boot.ts`'in açtığı bir sunucudan beslenir.

Copy-trading ve sosyal itibar sinyalleri (Manifesto v3, ClawHub
"SCARCAT Verified" rozeti) mimari olarak tanımlı ama **Bölüm 5.2'deki
yetkilendirme boşluğuna bağımlı** — o boşluk kapanmadan güvenli şekilde
inşa edilemez.

---

## 7. Güvenlik ve Yönetişim

- **Guardian seti**: 2/3 eşik, imzacılardan biri (Baş Stratejist)
  CEO'dan bağımsız bir taraf — tek kişinin (CEO) kendi cihazlarıyla
  tek başına yönetişimi ele geçirmesi yapısal olarak engellendi.
- **Red Team süreci**: her kontrat revizyonu (v1→v5), yayınlanmadan
  önce sistematik bir düşman-gözüyle inceleme turundan geçti; 12
  bulgu (kritik/orta/düşük) kapatıldı, hiçbiri gizlenmedi.
- **cast send --create disiplini**: `forge script`'in Robinhood Chain
  4663'te çalışmadığı bilindiği için tüm gerçek deploy'lar
  `cast send --create` ile yapılıyor; bu ayrım deploy script'lerinde
  runtime guard'larla (chain id kontrolü) zorunlu kılındı.
- **Private key hijyeni**: hiçbir private key, bu proje boyunca
  hiçbir dosyaya yazılmadı — sadece env değişkeni veya donanım cüzdanı
  ile işlem yapıldı.

---

## 8. Yol Haritası

| Faz | Durum | İçerik |
|---|---|---|
| Faz 1-2 | Tamamlandı | UI design system, animasyon, PWA (will-dapp) |
| Faz 3 | Tamamlandı | WillTokenV5 (v1→v5), OpenClaw node, swarm boot, monitor |
| Faz 4 | Tamamlandı | willdapp.com entegrasyonu, sosyal webhook, GitBook iskeleti |
| Faz 5 | Devam ediyor | scarcat-os commit disiplini, whitepaper, env şablonu |
| Faz 6 (post-MVP) | Planlanan | AgentScope (ince yetkilendirme), batch settlement, bağımsız audit |

Detaylı açık maddeler: `phase3-roadmap.md`.

---

## 9. Risk Faktörleri (dürüstçe listelenmeli)

Bu bölüm, yatırımcı materyaline dönüştürülmeden önce hukuk ekibi
tarafından genişletilmelidir. Bilinen, bu whitepaper'ın kendi
kaynaklarından doğrulanmış maddeler:

1. **WillTokenV5 bağımsız audit edilmemiştir.** İç Red Team süreci
   4 tur sürdü ama harici bir güvenlik firması incelemesi yoktur.
2. **Testnet adresi bağımsız doğrulanmamıştır** (bu ortamda RPC
   erişimi yoktu) — gerçek zincir durumu ayrıca teyit edilmeli.
3. **OpenClaw ekosisteminin çoğu (imsg, acpx, wacli, gogcli,
   clawsweeper, mcporter, openclaw-windows-node) henüz inşa
   edilmemiştir.** Sadece isimleri ve (bazılarında) tek cümlelik
   tanımları var.
4. **A2A ücret modeli kontrata bağlanmamıştır** — şu an tasarım
   aşamasında, gelir üretmiyor.
5. **Ajan yetkilendirmesi ince-taneli değildir** (Bölüm 5.2) — bu,
   copy-trading gibi özelliklerin güvenli inşasını engelliyor.
6. **WillTokenV5 ile WillDividendTracker (mevcut deploy edilmiş,
   farklı bir kontrat) arasındaki ilişki netleşmemiştir** — ikisi
   mimari olarak bağımsızdır, aynı kullanıcı kimliğini paylaştıkları
   varsayımı doğrulanmamıştır.

---

## 10. Ek

**Kaynaklar**: `openclaw-architecture.md`, `phase3-roadmap.md`,
`SCARCAT_ECON_MODEL.md`, `SCARCAT_MANIFESTO_V1/V2/V3.md`,
`DEPLOYMENT_LOG.md`, `dispatch/DISPATCH.md` (operasyon geçmişi).

**Sözlük**: *Intent* — EIP-712 imzalı transfer niyeti. *Guardian* —
WillTokenV5 yönetişim multisig üyesi. *Tier* — Pawn/Claw/Fang/Scarcat
(Claw Score bandı). *A2A* — Agent-to-Agent (ajanlar arası ekonomik
etkileşim).
