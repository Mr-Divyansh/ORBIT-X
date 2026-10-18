# 🎃 Dar Ka Dhandha™: Track 2 Concept

**Hackathon:** haX.baby "Baby's First Website" (Track 2: Your Own Baby)
**Code freeze:** 19 Oct 2026, 17:17 IST
**Tagline:** *"Din mein normal, raat mein… thoda kam normal."*

---

## 1. Concept in one line

Abhay & Divyansh do bilkul normal bachche hain. Halloween night pe wo trick-or-treaters ko pyaar se daraate hain, phir hansaate hain, phir toffee dete hain. Aksar khud hi dar jaate hain. Moti (puppy, chadar mein) unka Chief Ghost Officer hai.

**Track 2 rules check:** character "a fantastical version of yourself" ho sakta hai, toh normal ladke valid hain. Do rules: **friendly & kind** aur **100% original** (koi anime/game/existing IP lookalike nahi). Isliye pranks harmless hain aur har prank ke baad toffee milti hai.

---

## 2. Character Sheet (official 5-point format, site ke About section/modal mein)

1. **Name:** Abhay & Divyansh, company *Dar Ka Dhandha™* (staff: Moti, Chief Ghost Officer)
2. **What they are:** Do bilkul normal bachche, khelte hain, biscuit khaate hain, so jaate hain. Abhay darpok par curious ("Sacchi wali bilkul nahi!"). Divyansh daravni kahaniyon ka idea-guy, par "Bhaag!" sabse pehle wahi chillata hai. Moti ek puppy hai, chadar pehne toh "bhoot".
3. **What they do:** Halloween night pe trick-or-treaters ko pyaar se daraana, phir hansaana, phir toffee dena. Self-certified Junior Scare Professionals.
4. **Their story:** Chhat pe camping ki raat asli "bhoot" Moti nikla. Itna mazaa aaya ki company ban gayi.
5. **Tagline:** *"Hum daraate hain. Aksar khud dar jaate hain."*

**Company Rules (footer):**
- Har prank ke baad toffee.
- Chhote bachchon ko zyada nahi daraana.
- Moti ko kabhi chadar mat dena.

---

## 3. Case Files (projects, min 3)

Har card pe 3 meters: **Scare / Laugh / Toffee** (early-web dashboard vibe).

| # | Case | Prank | Backfire | Interaction |
|---|------|-------|----------|-------------|
| 1 | **Kaddu Kaand** | Candy bowl se googly-eyes wala glove nikalta hai: "BOO!", high-five, toffee | Glove ne Abhay ka hi haath pakad liya | Bowl pe click |
| 2 | **Haunted Doorbell v2.0** | Darawna organ… beech mein retro ringtone baj jaati hai | Padosi aunty ringtone pe naach padi | Bell click (Web Audio + mute) |
| 3 | **Chadar Wala Bhoot** | Bedsheet ghost, neeche se chappal dikh rahi hai | "Arre ye toh Divyansh hai!" | Aankhein cursor follow karti hain |
| 4 | **Operation Chhat Camp** | Pilot project (origin story) | Client Abhay: 3 din light jalakar soya | Click → story section |

---

## 4. Main Trick: Din/Raat Toggle

- **Din mode:** ekdum boring cream page. "Abhay & Divyansh, bilkul normal bachche."
- **Raat mode:** dark palette, page "Dar Ka Dhandha™" ban jaata hai, cursor **torch** ban jaata hai (CSS mask). Chhupe ghosts sirf roshni mein dikhte hain.
- Ek feature mein **Tier 1** (day/night toggle) + **Tier 2** (flashlight cursor).

---

## 5. Story Scroll (3 chapters)

Rule: har section/scene ~150 words ya kam. Text kam, motion/illustration zyada.

### Ch.1: Aadhi Raat Ka Mehmaan
Source: `story_1.md`, 8 chhote scenes (~40–70 words each):

1. "Abhay aur Divyansh ne is baar…" → "…zid karke saath laaya tha."
2. "Ek sacchi daravni kahani sunaun?" → "…aur shuru ho gaya."
3. "Aadhi kahani bhi poori nahi hui thi…" → "…deewar ko kheench rahi ho."
4. "Divyansh ne torch band kar di…" → "…saans rokkar."
5. "Phir tent ki zip…" → "…torch jalaayi."
6. "Waakai Moti tha…" → "…latak rahi thi."
7. "Ek second ki chuppi…" → "…Bas... Moti hai."
8. "Moti beech mein ghuskar…" → "…takiya ban chuki thi."

**Bridge line (end mein add):**
> *"Subah Divyansh bola: 'Ek pilla humein itna daraa gaya… toh hum duniya ko kitna daraa sakte hain?' Abhay: 'Sacchi wali nahi!' Aur yahin se Dar Ka Dhandha™ shuru."*

### Ch.2: Pehla Halloween
Dono ghost bankar gate pe. Asli star Moti (chadar mein). Bachche darte nahi, selfie maangte hain. Business model badla: **Dar → Hansi → Toffee**.

### Ch.3: Sharma Uncle Ki Chadar
Padosi (jinki chadar Moti ne uda li thi) chadar wapas maangne aate hain. Unke asli gusse se poori gali dar jaati hai, bina costume ke! Hired: **Senior Scare Consultant**.

---

## 6. Surprises & Bonus

- **Easter egg (required):** footer mein chhota button *"Shayad nahi dekhna chahiye…"*. Click karo toh Moti ki chadar gir jaati hai, andar bas ek puppy: bark + confetti + Bloopers (failed pranks) unlock.
- **Moti hero pe:** chadar ke eye-holes cursor follow karte hain (phone pe touch fallback). Site ka cute "face".
- **Easy side-quest points:** click sounds + mute toggle (+3), sparkle trail 🎃🍬 (+2), "Toffees baante: 000417" odometer (+1). Live guestbook (+2) sirf time bache toh.
- **Early-web soul (30% rubric):** marquee ticker ("Aaj ke bhoot: 3"), "Under Construction" banner, visitor odometer.

---

## 7. Tier Mapping

| Tier | Feature |
|------|---------|
| Tier 1 | Moti eye-tracking, scroll story, Din/Raat toggle, mobile responsive, Easter egg |
| Tier 2 | Torch/flashlight cursor + Web Audio doorbell (mute switch zaroori) |

Golden rule: ek polished Tier 1/2 > ek broken Tier 3.

---

## 8. Must-Do Checklist (official rules)

- [ ] Public GitHub repo, commits **17–19 Oct** ke beech
- [ ] Live deployed URL (Vercel/Netlify/GitHub Pages)
- [ ] Footer mein art/audio/library credits
- [ ] Art 100% original (no anime/game lookalikes)
- [ ] Mute toggle hamesha visible
- [ ] Mobile pe test (pehle din hi)
- [ ] Submission: URL, repo, story write-up, character sheet, credits
- [ ] Zero console errors