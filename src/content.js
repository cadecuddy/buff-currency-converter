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
      const convertedPriceStr = formattedCurrency.format(convertedPrice);
      const originalPriceStr = RMBPrice.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

      // Add OG price to market listings
      const isMarketList = element.closest('.detail-tab-cont') && window.location.href.startsWith("https://buff.163.com/goods/");

      // Add OG price to inventory listings
      const isInventoryList = element.closest('.detail-tab-cont') && !window.location.href.startsWith("https://buff.163.com/goods/");

      // Add smaller OG price to inspect page
      const isInspectBottom = element.closest('.inspect-bottom');

      if (isMarketList) {
        const priceElement = document.createElement('p');
        priceElement.style.fontSize = '0.95em';
        priceElement.style.color = 'gray';
        priceElement.textContent = `(¥${originalPriceStr})`;
        element.after(priceElement);
      }

      if (isInventoryList) {
        const priceElement = document.createElement('small');
        priceElement.style.fontSize = '1em';
        priceElement.style.paddingLeft = '0.5em';
        priceElement.style.color = 'gray';
        priceElement.textContent = `(¥${originalPriceStr})`;

        const parentElement = element.parentElement;
        parentElement.insertBefore(priceElement, element.nextSibling);
      }

      if (isInspectBottom) {
        const priceElement = document.createElement('p');
        priceElement.style.fontSize = '1em';
        priceElement.style.paddingTop = '0.5em';
        priceElement.style.color = 'gray';
        priceElement.textContent = `(¥${originalPriceStr})`;
        element.after(priceElement);
      }

      return convertedPriceStr;
    });
  }
}

main();