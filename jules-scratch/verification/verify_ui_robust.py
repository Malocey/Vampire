import time
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Wait for the server to start
        time.sleep(30)

        # Navigate to the page with a longer timeout
        page.goto("http://localhost:5173", timeout=60000)

        # Wait for the main container to be visible
        page.wait_for_selector(".intro-container", timeout=30000)

        # Click the "Spiel fortsetzen" button
        page.click("button:has-text('Spiel fortsetzen')")

        # Wait for the character creation screen
        page.wait_for_selector(".character-creation-container", timeout=30000)

        # Click the "Charaktererstellung abschließen" button
        page.click("button:has-text('Charaktererstellung abschließen')")

        # Wait for the main app container
        page.wait_for_selector(".app-container", timeout=30000)

        # Toggle the system interface
        page.click(".system-toggle-btn")

        # Wait for the system interface to be visible
        page.wait_for_selector(".system-interface.visible", timeout=30000)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    except PlaywrightTimeoutError as e:
        print(f"A timeout error occurred: {e}")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)