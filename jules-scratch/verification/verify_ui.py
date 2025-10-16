import time
from playwright.sync_api import sync_playwright, expect

def verify_connection(page):
    """
    Dieses Skript verifiziert den korrekten Startablauf der Anwendung:
    1. Interaktion mit dem Intro-Bildschirm.
    2. Übergang zur Charaktererstellung.
    3. Abschluss der Charaktererstellung und Übergang zum Spiel.
    4. Verbindungsaufbau zum WebSocket-Backend.
    5. Empfang der ersten Nachricht vom Spielleiter (KI).
    """
    try:
        # 1. Gehe zur Anwendungsseite
        page.goto("http://localhost:5173/")

        # 2. Intro-Bildschirm: Klicke auf "Neues Spiel"
        print("INFO: Auf Intro-Bildschirm warten...")
        expect(page.get_by_role("heading", name="Crimson Academy")).to_be_visible(timeout=10000)
        page.get_by_role("button", name="Neues Spiel starten").click()
        print("INFO: Neues Spiel gestartet, gehe zur Charaktererstellung.")

        # 3. Charaktererstellung abschließen
        print("INFO: Auf Charaktererstellungs-Bildschirm warten...")
        expect(page.get_by_role("heading", name="Systemdiagnose: Identitätsrekonstruktion")).to_be_visible(timeout=10000)
        page.get_by_role("button", name="Rekonstruktion abschließen").click()
        print("INFO: Charaktererstellung abgeschlossen, Spiel-HUD wird geladen.")

        # 4. Auf die erfolgreiche Verbindung und die erste KI-Nachricht warten
        log_panel = page.locator("#log-panel")

        print("INFO: Auf Systemnachricht 'Verbindung hergestellt' warten...")
        expect(log_panel.get_by_text("Verbindung hergestellt. Du kannst jetzt sprechen.")).to_be_visible(timeout=15000)
        print("INFO: Systemnachricht gefunden.")

        print("INFO: Auf die erste Nachricht des Spielleiters warten...")
        model_message_locator = log_panel.locator("p") # Suche nach irgendeinem <p> Tag in der Log-Box
        expect(model_message_locator.first).to_be_visible(timeout=45000)
        print("INFO: Erste Nachricht des Spielleiters gefunden.")

        # Kurze Pause, damit alles rendern kann
        time.sleep(2)

        # 5. Screenshot für die visuelle Überprüfung erstellen
        screenshot_path = "jules-scratch/verification/verification.png"
        page.screenshot(path=screenshot_path)
        print(f"INFO: Screenshot erfolgreich unter {screenshot_path} gespeichert.")

    except Exception as e:
        print(f"ERROR: Ein Fehler ist während der Verifizierung aufgetreten: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
        raise

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_connection(page)
        browser.close()

if __name__ == "__main__":
    main()