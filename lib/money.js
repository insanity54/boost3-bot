// greets ChatGPT


export function centsToDollars(cents) {
  const dollars = cents / 100; // Divide cents by 100 to get the dollar amount
  return "$" + dollars.toFixed(2); // Return the dollar amount with a dollar sign and rounded to 2 decimal places
}



export function dollarsToCents(dollarValue) {
  // Remove any commas from the dollar value string
  dollarValue = dollarValue.replace('$', '').replace(',', '');
  // Multiply by 100 to get cents
  var centsValue = Math.round(parseFloat(dollarValue) * 100);
  return centsValue;
}