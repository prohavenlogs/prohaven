export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  balance_label?: string;
  price_label?: string;
}

const bankNames = ["Chase Bank", "Capital One", "Bank of America", "Citibank", "Wells Fargo", "U.S. Bank", "PNC Bank", "Truist Bank", "Chime Bank", "HSBC", "Monzo", "Natwest", "Barclays", "Lloyds"];
const bankPrices: Record<string, number> = {
  "Chase Bank": 250, "Capital One": 300, "Bank of America": 300, "Citibank": 250,
  "Wells Fargo": 200, "U.S. Bank": 550, "PNC Bank": 600, "Truist Bank": 650,
  "Chime Bank": 700, "HSBC": 720, "Monzo": 730, "Natwest": 740,
  "Barclays": 745, "Lloyds": 750
};

// Calculate balance based on price
const calculateBalance = (price: number): string => {
  let min: number, max: number;
  if (price >= 250 && price <= 450) {
    min = 27000;
    max = 52000;
  } else if (price >= 500 && price <= 750) {
    min = 65000;
    max = 90000;
  } else {
    min = 10000;
    max = 25000;
  }
  const balance = Math.floor(Math.random() * (max - min + 1)) + min;
  return `$${balance.toLocaleString()}`;
};

export const BANKS: Product[] = [];
const bankDescription = "Online Access + Cookies + Account/Routing Number + Fullz + IP";
for (let i = 0; i < 150; i++) {
  const baseName = bankNames[i % bankNames.length];
  const price = bankPrices[baseName];
  const balance = calculateBalance(price);
  BANKS.push({
    id: `bank-${i + 1}`,
    name: baseName,
    description: bankDescription,
    price,
    category: "Banks",
    balance_label: balance
  });
}

const cardNames = ["Visa Card", "MasterCard"];
const cardPrices = [55, 65, 75, 85, 95];

export const CARDS: Product[] = [];
const cardDescription = "Holder Info + Card Number + Exp Date + CVV + Address";
for (let i = 0; i < 35; i++) {
  const baseName = cardNames[i % cardNames.length];
  const price = cardPrices[i % cardPrices.length];
  const balance = calculateBalance(price);
  CARDS.push({
    id: `card-${i + 1}`,
    name: baseName,
    description: cardDescription,
    price,
    category: "Cards",
    balance_label: balance
  });
}

const accountNames = ["Zelle", "Coinbase", "Gemini"];

export const ACCOUNTS: Product[] = [];
const accountDescription = "Verified Acc + Full Access + Email + Phone + Transaction History";
for (let i = 0; i < 15; i++) {
  const baseName = accountNames[i % accountNames.length];
  const balance = calculateBalance(250);
  ACCOUNTS.push({
    id: `acc-${i + 1}`,
    name: baseName,
    description: accountDescription,
    price: 250,
    category: "Accounts",
    balance_label: balance
  });
}
