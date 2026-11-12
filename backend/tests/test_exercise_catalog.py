"""
FitBase - Gyakorlat katalógus és kereső tesztek
Ellenőrizzük a beégetett gyakorlatlistát, a slug álneveket és a kategóriák épségét.
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../app/services/ai')))

try:
    from exercise_catalog import (
        LIBRARY_EXERCISES,
        COMMON_SLUG_ALIASES,
        BODY_PART_COLOR_MAP,
        BODY_PART_BADGE_MAP,
        get_catalog_prompt_summary,
    )
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False


@unittest.skipUnless(HAS_DEPS, "SQLAlchemy szükséges a katalógus teszteléséhez (pip install -r requirements.txt)")
class TestExerciseCatalog(unittest.TestCase):

    def test_alap_gyakorlatok_elerhetoek(self):
        # a legfontosabb alapgyakorlatoknak szerepelniük kell a könyvtárban
        slugs = [ex["slug"] for ex in LIBRARY_EXERCISES]
        self.assertIn("bench-press", slugs)
        self.assertIn("push-up", slugs)
        self.assertIn("dips", slugs)

    def test_gyakorlat_mezok_kitoltottsege(self):
        # minden gyakorlatnak kell hogy legyen címe, izomcsoportja és színe
        for ex in LIBRARY_EXERCISES:
            self.assertTrue(ex.get("slug"), "Hiányzó slug egy gyakorlatnál")
            self.assertTrue(ex.get("title"), f"Nincs címe: {ex.get('slug')}")
            self.assertTrue(ex.get("muscleGroup"), f"Nincs izomcsoport: {ex.get('slug')}")
            self.assertTrue(ex.get("color", "").startswith("#"), f"Hibás színkód: {ex.get('slug')}")

    def test_slug_aliasok_helyessege(self):
        # az elgépelt vagy szinonima slugok leképezése
        self.assertEqual(COMMON_SLUG_ALIASES.get("barbell-bench-press"), "bench-press")
        self.assertEqual(COMMON_SLUG_ALIASES.get("pushups"), "push-up")
        self.assertEqual(COMMON_SLUG_ALIASES.get("biceps-curls"), "bicep-curl")
        self.assertEqual(COMMON_SLUG_ALIASES.get("plank-tartas"), "plank")

    def test_testresz_szinek_leteznek(self):
        # ellenorizzuk hogy a főbb izomcsoportokhoz van szín társítva
        self.assertIn("chest", BODY_PART_COLOR_MAP)
        self.assertIn("back", BODY_PART_COLOR_MAP)
        self.assertIn("core", BODY_PART_COLOR_MAP)
        self.assertIn("upper_legs", BODY_PART_COLOR_MAP)

    def test_prompt_osszefoglalo_nem_ures(self):
        # az AI rendszerprompthoz generált összefoglaló szöveg formátuma
        summary = get_catalog_prompt_summary()
        self.assertIsInstance(summary, str)
        self.assertTrue(len(summary) > 100)
        self.assertIn("Chest:", summary)


if __name__ == "__main__":
    unittest.main()
