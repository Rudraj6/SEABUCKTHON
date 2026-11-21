// The number comes from the WhatsApp contact printed on the supplied campaign artwork.
// Override with VITE_WHATSAPP_NUMBER in a local .env file if the business line changes.
export const WHATSAPP_DISPLAY_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || '7208452760';
const internationalNumber = WHATSAPP_DISPLAY_NUMBER.replace(/\D/g, '').replace(
  /^0+/,
  ''
);
export const WHATSAPP_ORDER_URL = `https://wa.me/${internationalNumber.length === 10 ? `91${internationalNumber}` : internationalNumber}?text=${encodeURIComponent('Hello SEABUCKTHORN BHARAT, I would like to place an order or get product/order support.')}`;
