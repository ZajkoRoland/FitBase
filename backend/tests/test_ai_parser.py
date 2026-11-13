#FitBase - AI válasz feldolgozó és formátum javító tesztek
#Teszteljük a modellből érkező JSON javítását, a gyorsválaszok kinyerését és az edző logikát.
import unittest
import os
import sys

# Hozzáadjuk a backend mappákat az elérési úthoz
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../app/services/ai')))

from parser import (
    auto_close_json,
    is_json_leak,
    extract_quick_replies_from_text,
    strip_orphan_bullets,
    resolve_contextual_quick_replies,
    extract_coach_json_data,
)


class TestAIParser(unittest.TestCase):

    def test_auto_close_levagott_json(self):
        # ha az llm válasza félbemaradt és nincs lezárva az idézőjel meg a kapcsos zárójel
        csonka_szoveg = '{"reply_text": "Szia, összeállítottam a mai edzéstervet'
        javitott = auto_close_json(csonka_szoveg)
        self.assertTrue(javitott.endswith('"}'))
        self.assertTrue(javitott.startswith('{"reply_text"'))

    def test_auto_close_tombbel(self):
        # lista és objektum befejezése
        csonka = '{"napok": ["Hétfő", "Kedd"'
        javitott = auto_close_json(csonka)
        self.assertEqual(javitott, '{"napok": ["Hétfő", "Kedd"]}')

    def test_is_json_leak(self):
        # kiszivárgott raw json detektálása a normál szöveg helyett
        rossz_valasz = '{"slug": "bench-press", "exercises": ["push-up"]}'
        self.assertTrue(is_json_leak(rossz_valasz))

        # sima emberi válasznál nem szabad hibát jeleznie
        jo_valasz = "Szia Roland! Ma egy jó kis mell- és hátedzés vár rád."
        self.assertFalse(is_json_leak(jo_valasz))

    def test_extract_quick_replies_ha_szovegben_maradt(self):
        # néha a groq/gemini beleírja a szöveg végére hogy Quick replies: [...]
        nyers = "Itt a heti beosztásod!\n\nQuick replies: [\"Rögzítsd a tervet!\", \"Mutasd a gyakorlatokat!\"]"
        szoveg, gombok = extract_quick_replies_from_text(nyers)

        self.assertEqual(szoveg, "Itt a heti beosztásod!")
        self.assertEqual(len(gombok), 2)
        self.assertIn("Rögzítsd a tervet!", gombok)

    def test_strip_orphan_bullets(self):
        # levágja a felesleges felsorolásjeleket a szöveg végéről
        szoveg = "Első feladat: fekvenyomás\n* "
        tisztitott = strip_orphan_bullets(szoveg)
        self.assertEqual(tisztitott, "Első feladat: fekvenyomás")

    def test_kontextusos_gombok_pihenonap(self):
        # ha a felhasználó regenerációról vagy pihenőnapról kérdez
        gombok = resolve_contextual_quick_replies(
            text="Ma pihenőnapod van, fontos a megfelelő regeneráció és az alvás.",
            user_message="Nagyon fáradt vagyok",
            language="hu"
        )
        self.assertIsInstance(gombok, list)
        self.assertTrue(len(gombok) > 0)
        # ellenorizzuk hogy pihenonapos tippek jelennek meg
        talalat = any("nyújtás" in g.lower() or "regeneráció" in g.lower() for g in gombok)
        self.assertTrue(talalat)

    def test_extract_coach_json_markdown_blokkbol(self):
        # ha a modell markdown kódblokkba teszi a választ (pl. ```json ... ```)
        raw = """```json
{
  "reply_text": "Készen áll a heti bontás!",
  "quick_replies": ["Kezdjük!", "Módosítsunk"]
}
```"""
        eredmeny = extract_coach_json_data(raw, language="hu")
        self.assertEqual(eredmeny["reply_text"], "Készen áll a heti bontás!")
        self.assertEqual(eredmeny["quick_replies"], ["Kezdjük!", "Módosítsunk"])


if __name__ == "__main__":
    unittest.main()

