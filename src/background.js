// Fetch conversion rates from the API and store them in local storage
async function getConversionRates() {
  const response = await fetch("https://open.er-api.com/v6/latest/CNY");
  const data = await response.json();

  if (data.result !== "success") {
    throw new Error("Failed to fetch conversion rates");
  }

  await browser.storage.local.set({ rates: data.rates });
}

// Set up alarm and event listeners when the extension is installed
browser.runtime.onInstalled.addListener(async () => {
  // Create an alarm to update the conversion rates every 24 hours
  browser.alarms.create("updateRates", { periodInMinutes: 60 * 24 });

  // Update conversion rates when the alarm fires
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "updateRates") {
      await getConversionRates();
    }
  });

  // Get the conversion rates for the first time
  await getConversionRates();

  // Set the default currency to USD
  await browser.storage.local.set({ currency: "USD" });
});
