"""Browser Automation Session Manager for Playwright.
Uses local Google Chrome / Edge with stealth evasion to bypass bot detection.
"""
import os
import logging
from typing import Optional
from contextlib import asynccontextmanager
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

logger = logging.getLogger(__name__)

# Search candidates for installed browser executables
BROWSER_CANDIDATES = [
    os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
    os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
    os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
    os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
]

def get_installed_browser_path() -> Optional[str]:
    """Finds an installed Chrome or Edge executable on Windows."""
    for path in BROWSER_CANDIDATES:
        if os.path.exists(path):
            return path
    return None


@asynccontextmanager
async def get_stealth_browser(headless: bool = True):
    """Context manager providing an anti-detection Chromium instance."""
    browser_path = get_installed_browser_path()
    
    async with async_playwright() as p:
        launch_args = {
            "headless": headless,
            "args": [
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-infobars",
                "--disable-extensions",
                "--window-size=1920,1080",
            ]
        }
        if browser_path:
            launch_args["executable_path"] = browser_path

        browser: Browser = await p.chromium.launch(**launch_args)
        
        context: BrowserContext = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="Asia/Karachi",
        )
        
        # Bypass navigator.webdriver detection
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)
        
        try:
            yield context
        finally:
            await context.close()
            await browser.close()
