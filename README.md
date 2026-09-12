# AREEJ Ecommerce — Node 18

AREEJ luxury fragrance storefront built with Next.js 13.5.11 + React 18.2, designed to run on Node 18.13.0.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Admin

Create `.env.local`:

```env
ADMIN_PASSWORD=choose-a-strong-password
```

Then open `/admin`.

Admin controls include:

- Product name, base SKU and variant SKUs
- Product image upload / replacement and image URL
- Product sizes and prices, including 3 ML / 6 ML / 12 ML / 20 ML / 30 ML / 50 ML
- Published / draft status
- Explore the Signatures
- Best Sellers
- Find Your Fragrance → Explore First
- Discovery Sets: 3 or 5 different products, 3 ML / 6 ML, sum or fixed set pricing
- Minimum order toggle and amount
- Free delivery threshold and delivery charge
- 3 ML trial suggestion toggle and trial price

### Important current architecture note

The admin UI currently persists catalogue/merchandising/order settings in the browser's `localStorage`. The admin password itself is server-side via `ADMIN_PASSWORD` and an HTTP-only cookie.

For production enterprise operation, connect the admin controls to a persistent database and object storage (for product images). That is the next architecture step so changes made by the admin are visible to every visitor.

## Order channels

- WhatsApp: pre-filled order message
- Email: `mailto:` order message
- Instagram: opens `https://ig.me/m/areejattar72` on supported mobile contexts and copies the order message to the clipboard. Instagram does not provide a reliable universal web mechanism to pre-fill DM text, so the customer can paste the copied order message into the opened chat.

## Order rules

Default:

- Minimum order: ₹599
- Free delivery at ₹1,000+
- Delivery below ₹1,000: ₹75 PAN India

All of these are editable from Admin → Order Rules.

## Discovery Sets

Customers can build a set of exactly 3 or 5 different fragrances. The set is restricted to the configured 3 ML / 6 ML trial sizes. The admin controls whether the feature is enabled, which set sizes and trial sizes are offered, and pricing mode.

## Branding assets

The supplied AREEJ artwork has been integrated as image-led hero/collection artwork rather than being pasted into mismatched containers. The home hero uses a blended composition based on the supplied cream AREEJ banner and brand artwork. Pure Attar and Modern Perfume use the supplied collection artwork, with the modern perfume watermark used at low opacity.
