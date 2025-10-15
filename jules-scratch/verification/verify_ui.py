from playwright.sync_api import sync_playwright
import time

def run(playwright):
    time.sleep(30) # Wait for the server to start
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173")
        page.wait_for_selector(".intro-container", timeout=10000)
        page.click("button:has-text('Spiel fortsetzen')")
        page.wait_for_selector(".character-creation-container", timeout=10000)
        page.click("button:has-text('Charaktererstellung abschließen')")
        page.wait_for_selector(".app-container", timeout=10000)
        page.click(".system-toggle-btn")
        page.wait_for_selector(".system-interface.visible", timeout=10000)
        page.screenshot(path="jules-scratch/verification/verification.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)