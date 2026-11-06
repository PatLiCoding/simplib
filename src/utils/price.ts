// Removes everything but digits and one decimal separator, max. two decimals
export function cleanPrice(value: string): string {
  return value
    .replace(/[^0-9.,]/g, '')
    .replace(/^([^.,]*[.,][^.,]*).*$/, '$1')
    .replace(/([.,]\d{2})\d+$/, '$1')
}

export const isValidPrice = (price: string) => !price || /^\d+([.,]\d{1,2})?$/.test(price)

export const normalizePrice = (price: string) => price.replace(',', '.')
