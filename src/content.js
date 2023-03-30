let cachedRates;
let cachedCurrency;

// Main function to handle currency conversion and DOM updates
async function main() {
  // Get the cached rates and currency from local storage
  cachedRates = (await browser.storage.local.get("rates")).rates;
  cachedCurrency = (await browser.storage.local.get("currency")).currency;

  // Convert currencies in the initial document
  convertCurrencyInElement(document.body);

  // Observe DOM changes and convert currencies in added nodes
  const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        convertCurrencyInElement(node);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Listen for currency change messages from the popup
  browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case "currencyChanged":
        window.location.reload(); // Reload the page to apply changes
        break;
      default:
        console.error("Unknown message type", message);
        break;
    }
  });
}

// Convert currencies in the given element and its children
function convertCurrencyInElement(element) {
  if (element.children) {
    for (let child of element.children) {
      convertCurrencyInElement(child);
    }
  }

  // Find and convert RMB prices to the selected currency
  const reg = /¥ (\d+(.\d+)?)/gm;
  if (reg.test(element.textContent)) {
    element.textContent = element.textContent.replace(reg, (_match, matchGroup) => {
      const RMBPrice = Number.parseFloat(matchGroup);
      const convertedPrice = RMBPrice * cachedRates[cachedCurrency];
      const formattedCurrency = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: cachedCurrency,
      });
      return formattedCurrency.format(convertedPrice);
    });
  }
}

main();
