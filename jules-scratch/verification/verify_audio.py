from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Log console messages
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

    page.goto("http://localhost:5173/")
    print("Navigated to page")
    page.wait_for_load_state('networkidle')
    page.screenshot(path="jules-scratch/verification/0_initial.png")

    # Wait for the "Spiel starten" button to be visible and enabled
    start_button = page.get_by_role("button", name="Spiel starten")
    try:
        start_button.wait_for(state="visible", timeout=60000)
    except Exception as e:
        page.screenshot(path="jules-scratch/verification/1_timeout.png")
        print(f"Error waiting for start button: {e}")
        print(page.content())
        raise e

    print("Start button is visible")
    start_button.wait_for(state="enabled", timeout=60000)
    print("Start button is enabled")
    start_button.click()
    print("Clicked start button")
    page.screenshot(path="jules-scratch/verification/2_after_start_click.png")

    # Click the "Rekonstruktion abschließen" button
    page.get_by_role("button", name="Rekonstruktion abschließen").click()
    print("Clicked 'Rekonstruktion abschließen' button")
    page.screenshot(path="jules-scratch/verification/3_after_rekon_click.png")


    # Click the "Sitzung starten" button in the microphone control
    page.get_by_role("button", name="Sitzung starten").click()
    print("Clicked 'Sitzung starten' button")

    # Expect the microphone to be listening
    expect(page.get_by_text("Höre zu...")).to_be_visible()
    print("Listening text is visible")

    page.screenshot(path="jules-scratch/verification/verification.png")
    print("Screenshot taken")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)