from playwright.sync_api import sync_playwright
import time
import os

def test_level(page, level_id):
    # Navigate and wait
    page.goto('http://localhost:3000')
    time.sleep(1)

    # We can use the UI! Let's click "Level Select", but earlier we had progression locked.

    # Force load level
    page.evaluate(f"window.router.game.loadLevel({level_id - 1})")
    page.evaluate("window.router.maps('screen-game')")
    time.sleep(1)

    os.makedirs('screenshots', exist_ok=True)
    page.screenshot(path=f'screenshots/fixed_lvl{level_id}.png')
    print(f"Captured screenshot for level {level_id}")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    test_level(page, 5)
    test_level(page, 6)
    test_level(page, 8)
    test_level(page, 11)
    browser.close()
