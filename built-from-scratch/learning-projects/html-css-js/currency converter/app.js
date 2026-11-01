const BASE_URL =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies";

const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");

for (let select of dropdowns) {
  for (currCode in countryList) {
    let newOption = document.createElement("option");
    newOption.innerText = currCode;
    newOption.value = currCode;
    if (select.name === "from" && currCode === "USD") {
      newOption.selected = "selected";
    } else if (select.name === "to" && currCode === "INR") {
      newOption.selected = "selected";
    }
    select.append(newOption);
  }

  select.addEventListener("change", (evt) => {
    updateFlag(evt.target);
  });
}

const updateExchangeRate = async () => {
  const amount = document.querySelector(".amount input");
  const amountValue = Number(amount.value);
  if (!Number.isFinite(amountValue) || amountValue < 1) {
    msg.innerText = "Enter a valid amount of at least 1.";
    return;
  }
  const URL = `${BASE_URL}/${fromCurr.value.toLowerCase()}/${toCurr.value.toLowerCase()}.json`;
  msg.innerText = "Getting the latest exchange rate...";
  try {
    const response = await fetch(URL);
    if (!response.ok) throw new Error(`Exchange-rate request failed: ${response.status}`);
    const data = await response.json();
    const rate = data[toCurr.value.toLowerCase()];
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("Exchange rate unavailable.");

    const finalAmount = amountValue * rate;
    if (!Number.isFinite(finalAmount)) throw new Error("Converted amount is invalid.");
    msg.innerText = `${amountValue} ${fromCurr.value} = ${finalAmount} ${toCurr.value}`;
  } catch {
    msg.innerText = "Could not get the exchange rate. Please try again.";
  }
};

const updateFlag = (element) => {
  let currCode = element.value;
  let countryCode = countryList[currCode];
  let newSrc = `https://flagsapi.com/${countryCode}/flat/64.png`;
  let img = element.parentElement.querySelector("img");
  img.src = newSrc;
};

btn.addEventListener("click", (evt) => {
  evt.preventDefault();
  updateExchangeRate();
});

window.addEventListener("load", () => {
  updateExchangeRate();
});