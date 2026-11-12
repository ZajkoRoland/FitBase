"""
FitBase - Egyszerű tesztfuttató szkript
Futtatás: python run_tests.py
"""

import unittest
import sys
import os

if __name__ == "__main__":
    print("=" * 60)
    print(" FitBase Egységtesztek Futtatása")
    print("=" * 60)
    
    loader = unittest.TestLoader()
    start_dir = os.path.join(os.path.dirname(__file__), "tests")
    suite = loader.discover(start_dir, pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    if result.wasSuccessful():
        print("\n Minden teszt sikeresen lefutott!")
        sys.exit(0)
    else:
        print("\n Hiba történt valamelyik tesztben!")
        sys.exit(1)

