// Get the current currency from local storage
async function getCurrentCurrency() {
  const data = await browser.storage.local.get("currency");
  return data.currency;
}

// Get the conversion rates from local storage
async function getConversionRates() {
  const data = await browser.storage.local.get("rates");
  return data.rates;
}

// Populate the currency dropdown with the available currencies
async function populateCurrencySelect() {
  const currencySelect = document.getElementById("currencySelect");
  const rates = await getConversionRates();
  const currentCurrency = await getCurrentCurrency();

  // Create dropdown options for each currency
  for (const currency in rates) {
    const option = document.createElement("option");
    option.value = currency;
    option.text = currency;
    option.selected = currency === currentCurrency;
    currencySelect.appendChild(option);
  }
}

// Set the selected currency and notify tabs of the change
async function setCurrency() {
  const currencySelect = document.getElementById("currencySelect");
  const newCurrency = currencySelect.value;
  await browser.storage.local.set({ currency: newCurrency });

  // Notify all matching tabs of the changed currency
  browser.tabs.query({ url: "*://buff.163.com/*" }, (tabs) => {
    for (const tab of tabs) {
      browser.tabs.sendMessage(tab.id, {
        type: "currencyChanged",
        currency: newCurrency,
      });
    }
  });
}

document.getElementById("currencySelect").addEventListener("change", setCurrency);

// Populate the currency dropdown on load
(async () => {
  await populateCurrencySelect();
})();
