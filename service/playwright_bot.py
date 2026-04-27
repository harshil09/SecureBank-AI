# backend/services/playwright_bot.py

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
import asyncio
import re

class BankUIBot:
    """
    Automated UI testing bot for MyBank Pro dashboard.
    Performs deposit and withdrawal actions via Playwright.
    """
    
    def __init__(self):
        self.base_url = "http://localhost:5173"
        self.dashboard_url = f"{self.base_url}/dashboard"
        self.p = None
        self.browser = None
        self.page = None
        self.is_ready = False

    async def start(self):
        """Initialize Playwright browser and page."""
        try:
            self.p = await async_playwright().start()
            
            # Launch browser in headed mode to see automation
            self.browser = await self.p.chromium.launch(
                headless=False,
                slow_mo=500  # Slow down by 500ms to see actions
            )
            
            # Create a new page with viewport
            self.page = await self.browser.new_page(
                viewport={"width": 1920, "height": 1080}
            )

            # Navigate to dashboard
            await self.page.goto(self.dashboard_url)
            
            # Wait for dashboard to load
            await self.wait_for_dashboard()
            
            self.is_ready = True
            print("✅ Playwright bot initialized successfully")
            
        except Exception as e:
            print(f"❌ Failed to start Playwright: {e}")
            self.is_ready = False
            raise


    async def wait_for_dashboard(self, timeout: int = 10000):
        """
        Wait for dashboard to fully load.
        
        Args:
            timeout: Maximum wait time in milliseconds
        """
        try:
            # Wait for the dashboard container to be visible
            await self.page.wait_for_selector(
                "#dashboard-container",
                state="visible",
                timeout=timeout
            )
            
            # Wait for balance to be visible (indicates data loaded)
            await self.page.wait_for_selector(
                "#current-balance",
                state="visible",
                timeout=timeout
            )
            
            print("✅ Dashboard loaded successfully")
            
        except PlaywrightTimeoutError:
            print("⚠️ Dashboard not fully loaded (user may not be logged in)")
            # Don't raise - bot can still try to perform actions

    async def ensure_dashboard(self):
        """Ensure we're on the dashboard page and it's loaded."""
        if not self.page:
            raise RuntimeError("Playwright not initialized. Call start() first.")
        
        current_url = self.page.url
        
        # If not on dashboard, navigate there
        if "/dashboard" not in current_url:
            print(f"📍 Navigating to dashboard from {current_url}")
            await self.page.goto(self.dashboard_url)
            await self.wait_for_dashboard()

    async def deposit_ui(self, amount: float):
        """
        Automate deposit action on the UI.
        
        Args:
            amount: Amount to deposit
        """
        if not self.is_ready:
            print("⚠️ Playwright bot not ready, skipping UI automation")
            return
        
        try:
            print(f"🤖 Automating deposit of ₹{amount}")
            
            # Ensure we're on dashboard
            await self.ensure_dashboard()
            
            await self._perform_money_action(
                action="deposit",
                amount=amount
            )
            
            print(f"✅ Successfully automated deposit of ₹{amount}")
            
            # Wait a bit for the transaction to process
            await asyncio.sleep(1)
            
        except PlaywrightTimeoutError as e:
            print(f"⏱️ Timeout during deposit automation: {e}")
        except Exception as e:
            print(f"❌ Error during deposit automation: {e}")

    async def withdraw_ui(self, amount: float):
        """
        Automate withdrawal action on the UI.
        
        Args:
            amount: Amount to withdraw
        """
        if not self.is_ready:
            print("⚠️ Playwright bot not ready, skipping UI automation")
            return
        
        try:
            print(f"🤖 Automating withdrawal of ₹{amount}")
            
            # Ensure we're on dashboard
            await self.ensure_dashboard()
            
            await self._perform_money_action(
                action="withdraw",
                amount=amount
            )
            
            print(f"✅ Successfully automated withdrawal of ₹{amount}")
            
            # Wait a bit for the transaction to process
            await asyncio.sleep(1)
            
        except PlaywrightTimeoutError as e:
            print(f"⏱️ Timeout during withdrawal automation: {e}")
        except Exception as e:
            print(f"❌ Error during withdrawal automation: {e}")

    async def get_current_balance(self) -> str:
        """
        Read the current balance from the UI.
        
        Returns:
            Balance as string or "N/A" if not available
        """
        try:
            await self.ensure_dashboard()
            
            balance_element = await self.page.wait_for_selector(
                "#current-balance",
                state="visible",
                timeout=3000
            )
            
            balance_text = await balance_element.inner_text()
            return balance_text
            
        except Exception as e:
            print(f"❌ Error reading balance: {e}")
            return "N/A"

    async def _perform_money_action(self, action: str, amount: float):
        """
        Fill amount in input and click button for deposit/withdraw,
        then wait for balance to refresh on dashboard.
        """
        balance_before_text = await self.get_current_balance()
        balance_before = self._parse_balance_to_float(balance_before_text)
        amount_text = self._format_amount_input(amount)

        # Primary selectors by explicit IDs.
        input_selector = "#deposit-input" if action == "deposit" else "#withdraw-input"
        button_selector = "#deposit-btn" if action == "deposit" else "#withdraw-btn"

        try:
            await self.page.wait_for_selector(input_selector, state="visible", timeout=5000)
            await self.page.fill(input_selector, "")
            await self.page.fill(input_selector, amount_text)
            await asyncio.sleep(0.25)
            await self.page.click(f"{button_selector}:not([disabled])", timeout=3000)
        except Exception:
            # Fallback by card title + placeholder + visible button text.
            card_title = "Deposit Money" if action == "deposit" else "Withdraw Money"
            btn_text = "Add Money" if action == "deposit" else "Withdraw"
            card = self.page.locator("div").filter(has_text=card_title).first
            input_box = card.locator("input[placeholder='Enter amount']").first
            action_btn = card.get_by_role("button", name=btn_text).first

            await input_box.wait_for(state="visible", timeout=5000)
            await input_box.fill("")
            await input_box.fill(amount_text)
            await asyncio.sleep(0.25)
            await action_btn.click(timeout=3000)

        await self._wait_for_balance_change(balance_before)

    async def _wait_for_balance_change(self, previous_balance: float, timeout_ms: int = 8000):
        """Wait until `#current-balance` reflects a changed numeric value."""
        if previous_balance is None:
            await asyncio.sleep(1)
            return

        end_time = asyncio.get_event_loop().time() + (timeout_ms / 1000)
        while asyncio.get_event_loop().time() < end_time:
            current_text = await self.get_current_balance()
            current_balance = self._parse_balance_to_float(current_text)
            if current_balance is not None and current_balance != previous_balance:
                print(f"✅ Balance updated on dashboard: {current_text}")
                return
            await asyncio.sleep(0.4)

        print("⚠️ Balance did not visibly change within timeout")

    def _format_amount_input(self, amount: float) -> str:
        """Format amount for numeric input fields."""
        if float(amount).is_integer():
            return str(int(amount))
        return str(amount)

    def _parse_balance_to_float(self, balance_text: str):
        """Parse a dashboard balance string like ₹1,500 into float."""
        if not balance_text:
            return None

        cleaned = re.sub(r"[^\d.]", "", balance_text)
        if not cleaned:
            return None

        try:
            return float(cleaned)
        except ValueError:
            return None

    async def take_screenshot(self, filename: str = "dashboard_screenshot.png"):
        """
        Take a screenshot of the current page.
        
        Args:
            filename: Output filename for screenshot
        """
        try:
            await self.page.screenshot(path=filename, full_page=True)
            print(f"📸 Screenshot saved: {filename}")
        except Exception as e:
            print(f"❌ Error taking screenshot: {e}")

    async def close(self):
        """Clean up browser resources."""
        try:
            if self.page:
                await self.page.close()
            if self.browser:
                await self.browser.close()
            if self.p:
                await self.p.stop()
            
            self.is_ready = False
            print("🔴 Playwright bot closed")
            
        except Exception as e:
            print(f"❌ Error closing Playwright: {e}")

    async def __aenter__(self):
        """Context manager entry."""
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        await self.close()

if __name__ == "__main__":
    import asyncio

    async def test():
        async with BankUIBot() as bot:
            await bot.deposit_ui(500)

    asyncio.run(test())
