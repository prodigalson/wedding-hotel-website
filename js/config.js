/* ============================================================
   WEDDING SITE SETTINGS
   This is the ONLY file you need to edit.
   Change the text between the quotation marks, then save.
   ============================================================ */

const CONFIG = {

  /* --- The couple and the wedding --- */
  COUPLE_NAMES: "Michael and Isabella",            // Your names, exactly as you want them shown
  WEDDING_DATE: "2027-06-12",                // Format: YYYY-MM-DD
  VENUE_NAME: "Masseria San Vito",           // Name of the wedding venue
  VENUE_ADDRESS: "Triggianello, Conversano BA, Puglia, Italy",
  VENUE_LAT: 40.9330,                        // Venue map position (latitude)
  VENUE_LNG: 17.2110,                        // Venue map position (longitude)

  /* --- Welcome message shown on the home screen (3 languages) --- */
  WELCOME_EN: "We can't wait to celebrate with you in Puglia. We reserved rooms at our favourite hotels nearby so finding a place to stay is easy. Pick one below and we'll see you under the olive trees.",
  WELCOME_PT: "Mal podemos esperar para celebrar com vocês na Puglia. Reservamos quartos nos nossos hotéis favoritos da região para facilitar a sua estadia. Escolha um abaixo e nos vemos sob as oliveiras.",
  WELCOME_IT: "Non vediamo l'ora di festeggiare con voi in Puglia. Abbiamo riservato camere nei nostri hotel preferiti della zona per rendere tutto più semplice. Sceglietene uno qui sotto e ci vediamo sotto gli ulivi.",

  /* --- Hero photo on the home screen (a web link to a photo) --- */
  HERO_IMAGE: "https://images.unsplash.com/photo-1600160805984-2d44e4a1a903?w=1600&q=80&auto=format&fit=crop",

  /* --- Optional WhatsApp number for guest questions (leave "" to hide) ---
     Use international format with no spaces, e.g. "393331234567"        */
  WHATSAPP: "",

  /* --- Database connection (from Supabase, see SETUP-GUIDE) ---
     While these still say PASTE_..., the site runs in Demo Mode
     with sample hotels so you can preview everything.            */
  SUPABASE_URL: "PASTE_YOUR_SUPABASE_URL_HERE",
  SUPABASE_ANON_KEY: "PASTE_YOUR_SUPABASE_ANON_KEY_HERE"
};
