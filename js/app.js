/* Guest-facing app. Handles language, data loading, routing and reservations. */

(function () {
  "use strict";

  /* ---------- Data layer: Supabase or Demo Mode ---------- */
  const DEMO = !CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.startsWith("PASTE");
  const sb = DEMO ? null : window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

  let hotelsCache = null;
  const demoReservations = {};

  async function loadHotels(force) {
    if (hotelsCache && !force) return hotelsCache;
    if (DEMO) {
      hotelsCache = JSON.parse(JSON.stringify(SAMPLE_HOTELS));
      return hotelsCache;
    }
    const { data: hotels, error } = await sb.from("hotels")
      .select("*, rooms(*)").eq("active", true).order("sort_order");
    if (error) throw error;
    hotels.forEach(h => h.rooms = (h.rooms || []).sort((a, b) => (a.price || 0) - (b.price || 0)));
    hotelsCache = hotels;
    return hotelsCache;
  }

  function findHotel(id) { return (hotelsCache || []).find(h => String(h.id) === String(id)); }
  function findRoom(roomId) {
    for (const h of (hotelsCache || [])) {
      const r = (h.rooms || []).find(r => String(r.id) === String(roomId));
      if (r) return { hotel: h, room: r };
    }
    return null;
  }

  async function createReservation(payload) {
    if (DEMO) {
      const found = findRoom(payload.room_id);
      if (!found || found.room.remaining <= 0) return { ok: false, error: "sold_out" };
      found.room.remaining -= 1;
      const id = "demo-res-" + Math.random().toString(36).slice(2, 8);
      demoReservations[id] = Object.assign({ id }, payload);
      return { ok: true, id };
    }
    const { data, error } = await sb.rpc("reserve_room", {
      p_room_id: payload.room_id,
      p_first_name: payload.first_name,
      p_last_name: payload.last_name,
      p_email: payload.email,
      p_phone: payload.phone || null,
      p_arrival: payload.arrival,
      p_departure: payload.departure,
      p_guests: payload.guests
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }

  /* ---------- Small helpers ---------- */
  const app = document.getElementById("app");
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function starIcons(n) { return "★".repeat(n || 0); }
  function euro(n) { return "€" + Number(n || 0).toLocaleString(localeCode()); }
  function mapsEmbed(lat, lng, label) {
    const q = (lat && lng) ? lat + "," + lng : encodeURIComponent(label || "");
    return "https://maps.google.com/maps?q=" + q + "&z=13&output=embed";
  }
  function mapsLink(lat, lng, label) {
    const q = (lat && lng) ? lat + "," + lng : encodeURIComponent(label || "");
    return "https://maps.google.com/?q=" + q;
  }
  function availabilityLabel(remaining) {
    if (remaining <= 0) return { text: t("sold_out"), cls: "out" };
    if (remaining <= 2) return { text: t("only_x_left", { n: remaining }), cls: "low" };
    return { text: remaining + " " + (remaining === 1 ? t("room_left") : t("rooms_left")), cls: "" };
  }
  const oliveBranch = '<svg width="70" height="22" viewBox="0 0 70 22" fill="none" aria-hidden="true"><path d="M2 11 C 20 4, 50 4, 68 11" stroke="currentColor" stroke-width="1.4" fill="none"/><ellipse cx="16" cy="7" rx="4.5" ry="2.2" transform="rotate(-24 16 7)" fill="currentColor" opacity="0.75"/><ellipse cx="34" cy="4.6" rx="4.5" ry="2.2" fill="currentColor" opacity="0.75"/><ellipse cx="52" cy="7" rx="4.5" ry="2.2" transform="rotate(24 52 7)" fill="currentColor" opacity="0.75"/><circle cx="26" cy="10" r="2.4" fill="currentColor"/><circle cx="44" cy="10" r="2.4" fill="currentColor"/></svg>';

  /* ---------- Header / footer chrome ---------- */
  function initials() {
    const parts = CONFIG.COUPLE_NAMES.split(/\s+(?:&|and|e|et)\s+|\s*&\s*/i).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[0][0] + " & " + parts[1][0];
    return CONFIG.COUPLE_NAMES;
  }
  function renderChrome() {
    document.getElementById("brand").textContent = initials();
    document.getElementById("footerNames").textContent = CONFIG.COUPLE_NAMES;
    document.getElementById("footerPlace").textContent = t("tagline") + " · " + fmtDate(CONFIG.WEDDING_DATE);
    const wa = document.getElementById("footerWhatsApp");
    wa.innerHTML = CONFIG.WHATSAPP
      ? '<a class="whatsapp-link" target="_blank" rel="noopener" href="https://wa.me/' + esc(CONFIG.WHATSAPP) + '">' + esc(t("whatsapp_us")) + "</a>" : "";
    document.querySelectorAll("#langSwitch button").forEach(b => {
      b.classList.toggle("active", b.dataset.lang === getLang());
    });
    document.documentElement.lang = getLang();
  }
  document.getElementById("langSwitch").addEventListener("click", e => {
    const b = e.target.closest("button[data-lang]");
    if (!b) return;
    setLang(b.dataset.lang);
    renderChrome();
    route();
  });

  /* ---------- Views ---------- */
  function demoBanner() {
    return DEMO ? '<div class="notice">' + esc(t("demo_notice")) + "</div>" : "";
  }

  function viewHome() {
    app.innerHTML =
      '<div class="landing">' +
        '<div class="montage-container">' +
          '<div class="slice"></div>' +
          '<div class="slice"></div>' +
          '<div class="slice"></div>' +
        "</div>" +
        '<div class="cta-container">' +
          '<button class="cta-button" id="bookHotelBtn">Book Hotel ' +
            '<span class="arrow">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>' +
            "</span>" +
          "</button>" +
        "</div>" +
        '<div class="ui-layer">' +
          '<div class="hero-block">' +
            '<h1 class="hero-title">Michael<br><span class="offset">&amp; Isabella</span></h1>' +
            '<div class="sub-hero">June 17-20, 2027</div>' +
          "</div>" +
          '<svg class="geometry" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1"></circle>' +
            '<circle cx="120" cy="120" r="60" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1"></circle>' +
            '<line x1="20" y1="80" x2="140" y2="80" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="2 4"></line>' +
          "</svg>" +
        "</div>" +
      "</div>";
    document.getElementById("bookHotelBtn").addEventListener("click", () => {
      location.hash = "#/hotels";
    });
  }
  function hotelWelcome() {
    return { en: CONFIG.WELCOME_EN, pt: CONFIG.WELCOME_PT, it: CONFIG.WELCOME_IT }[getLang()] || CONFIG.WELCOME_EN;
  }

  let sortMode = "distance";
  async function viewHotels() {
    app.innerHTML = '<div class="section-head" style="margin-top:28px"><h2>' + esc(t("our_hotels")) + '</h2></div><div class="skeleton" style="margin-top:16px"></div>';
    let hotels;
    try { hotels = await loadHotels(); }
    catch (e) { app.innerHTML = '<div class="notice" style="margin-top:30px">' + esc(t("error_loading")) + "</div>"; return; }

    const sorted = hotels.slice().sort((a, b) => {
      if (sortMode === "price") return (a.price_from || 0) - (b.price_from || 0);
      if (sortMode === "rating") return (b.stars || 0) - (a.stars || 0);
      return (a.distance_km || 0) - (b.distance_km || 0);
    });

    const cards = sorted.map(h => {
      const remaining = (h.rooms || []).reduce((s, r) => s + (r.remaining || 0), 0);
      const av = availabilityLabel(remaining);
      const photo = (h.photos && h.photos[0]) || "";
      return '<article class="hotel-card">' +
        '<div class="photo"><img loading="lazy" src="' + esc(photo) + '" alt="' + esc(h.name) + '">' +
        '<div class="availability-pill ' + av.cls + '">' + esc(av.text) + "</div></div>" +
        '<div class="body">' +
          "<h3>" + esc(h.name) + "</h3>" +
          '<div class="meta-row"><span class="stars" aria-label="' + h.stars + ' stars">' + starIcons(h.stars) + "</span>" +
          "<span>" + esc((h.distance_km || 0) + " km " + t("from_venue")) + "</span></div>" +
          '<div class="price-line">' + esc(t("from_price")) + " <strong>" + euro(h.price_from) + "</strong> " + esc(t("per_night")) + "</div>" +
          '<p class="card-desc">' + esc(hotelText(h, "description")) + "</p>" +
          '<div class="amenity-row">' + (h.amenities || []).map(a => '<span class="amenity">' + esc(t("am_" + a)) + "</span>").join("") + "</div>" +
          '<a class="btn ' + (remaining <= 0 ? "secondary" : "") + '" href="#/hotel/' + esc(h.id) + '">' + esc(t("view_hotel")) + "</a>" +
        "</div></article>";
    }).join("");

    app.innerHTML =
      '<div class="fade-in">' +
      demoBanner() +
      '<a class="back-link" href="#/">← ' + esc(t("back")) + "</a>" +
      '<div class="section-head" style="margin-top:0"><h2>' + esc(t("our_hotels")) + "</h2></div>" +
      '<p class="section-sub">' + esc(t("hotels_intro")) + "</p>" +
      '<div class="sort-row"><span class="label">' + esc(t("sort_by")) + "</span>" +
        sortChip("distance") + sortChip("price") + sortChip("rating") +
      "</div>" +
      '<div class="hotel-grid">' + cards + "</div>" +
      '<div style="height:40px"></div></div>';

    app.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => {
      sortMode = c.dataset.sort; viewHotels();
    }));
  }
  function sortChip(mode) {
    return '<button class="chip ' + (sortMode === mode ? "active" : "") + '" data-sort="' + mode + '">' +
      esc(t("sort_" + mode)) + "</button>";
  }

  async function viewHotel(id) {
    await ensureHotels();
    const h = findHotel(id);
    if (!h) { location.hash = "#/hotels"; return; }
    const photos = (h.photos || []).slice(0, 3).map((p, i) =>
      '<img src="' + esc(p) + '" alt="' + esc(h.name) + " photo " + (i + 1) + '" loading="' + (i ? "lazy" : "eager") + '">').join("");

    const roomRows = (h.rooms || []).map(r => {
      const av = availabilityLabel(r.remaining || 0);
      const out = (r.remaining || 0) <= 0;
      return '<div class="room-row"><div>' +
        '<div class="room-name">' + esc(r.name) + "</div>" +
        '<div class="room-sub">' + euro(r.price) + " " + esc(t("per_night")) + "</div>" +
        '<div class="room-sub ' + av.cls + '">' + esc(av.text) + "</div>" +
        "</div>" +
        (out ? '<button class="btn secondary" disabled>' + esc(t("sold_out")) + "</button>"
             : '<a class="btn" href="#/reserve/' + esc(r.id) + '">' + esc(t("reserve")) + "</a>") +
        "</div>";
    }).join("");

    app.innerHTML =
      '<div class="fade-in">' +
      '<a class="back-link" href="#/hotels">← ' + esc(t("back_hotels")) + "</a>" +
      '<div class="gallery">' + photos + "</div>" +
      '<h1 class="detail-title">' + esc(h.name) + "</h1>" +
      '<div class="meta-row" style="margin-top:6px"><span class="stars">' + starIcons(h.stars) + "</span>" +
        "<span>" + esc((h.distance_km || 0) + " km " + t("from_venue")) + "</span>" +
        "<span>" + esc(t("travel_time", { n: h.travel_minutes || "?" })) + "</span></div>" +
      '<div class="info-card"><h3>' + esc(t("about_hotel")) + "</h3><p>" + esc(hotelText(h, "description")) + "</p>" +
        '<div class="amenity-row" style="margin-top:12px">' + (h.amenities || []).map(a => '<span class="amenity" style="background:#fff">' + esc(t("am_" + a)) + "</span>").join("") + "</div></div>" +
      '<div class="info-card"><h3>' + esc(t("room_types")) + "</h3>" + roomRows + "</div>" +
      '<div class="info-card"><h3>' + esc(t("location")) + "</h3><p>" + esc(h.address || "") + "</p>" +
        '<iframe class="map-frame" loading="lazy" title="Map" src="' + mapsEmbed(h.lat, h.lng, h.address || h.name) + '"></iframe>' +
        '<p style="margin-top:10px"><a target="_blank" rel="noopener" href="' + mapsLink(h.lat, h.lng, h.address || h.name) + '">' + esc(t("map_open")) + "</a></p></div>" +
      '<div class="info-card"><h3>' + esc(t("cancellation")) + "</h3><p>" + esc(hotelText(h, "cancellation")) + "</p></div>" +
      '<div style="height:40px"></div></div>';
    window.scrollTo(0, 0);
  }

  async function viewReserve(roomId) {
    await ensureHotels();
    const found = findRoom(roomId);
    if (!found) { location.hash = "#/hotels"; return; }
    const { hotel, room } = found;
    const wd = CONFIG.WEDDING_DATE;
    const defArrival = addDays(wd, -1), defDeparture = addDays(wd, 1);

    app.innerHTML =
      '<div class="fade-in has-sticky">' +
      '<a class="back-link" href="#/hotel/' + esc(hotel.id) + '">← ' + esc(hotel.name) + "</a>" +
      '<div class="section-head" style="margin-top:0"><h2>' + esc(t("your_reservation")) + "</h2></div>" +
      '<div class="summary-box">' +
        '<div class="row"><span>Hotel</span><span>' + esc(hotel.name) + "</span></div>" +
        '<div class="row"><span>' + esc(t("room_types")) + "</span><span>" + esc(room.name) + "</span></div>" +
        '<div class="row"><span>' + esc(t("per_night")) + "</span><span>" + euro(room.price) + "</span></div>" +
      "</div>" +
      '<form id="resForm" class="form-card" novalidate>' +
        '<div class="two-col">' +
          field("first_name", t("first_name"), "text", "given-name") +
          field("last_name", t("last_name"), "text", "family-name") +
        "</div>" +
        field("email", t("email"), "email", "email") +
        field("phone", t("phone"), "tel", "tel", false) +
        '<div class="two-col">' +
          dateField("arrival", t("arrival"), defArrival) +
          dateField("departure", t("departure"), defDeparture) +
        "</div>" +
        '<div class="field"><label for="guests">' + esc(t("guests")) + '</label><select id="guests" name="guests">' +
          [1, 2, 3, 4].map(n => '<option value="' + n + '"' + (n === 2 ? " selected" : "") + ">" +
            esc(n === 1 ? t("guest_1") : t("guests_n", { n })) + "</option>").join("") +
        "</select></div>" +
        '<p style="color:var(--grigio);font-size:14.5px">' + esc(t("date_hint", { date: fmtDate(wd) })) + "</p>" +
        '<div class="form-msg" id="formMsg" role="alert"></div>' +
        '<div class="sticky-cta"><button type="submit" class="btn" id="submitBtn">' + esc(t("confirm_reservation")) + "</button></div>" +
      "</form></div>";
    window.scrollTo(0, 0);

    document.getElementById("resForm").addEventListener("submit", async e => {
      e.preventDefault();
      const msg = document.getElementById("formMsg");
      const btn = document.getElementById("submitBtn");
      msg.textContent = "";
      let valid = true;
      ["first_name", "last_name", "email", "arrival", "departure"].forEach(idn => {
        const el = document.getElementById(idn);
        const bad = !el.value.trim() || (idn === "email" && !/^\S+@\S+\.\S+$/.test(el.value));
        el.closest(".field").classList.toggle("error", bad);
        if (bad) valid = false;
      });
      if (!valid) { msg.textContent = t("required_fields"); return; }
      const arrival = document.getElementById("arrival").value;
      const departure = document.getElementById("departure").value;
      if (departure <= arrival) { msg.textContent = t("invalid_dates"); return; }

      btn.disabled = true; btn.textContent = t("reserving");
      const payload = {
        room_id: room.id,
        first_name: document.getElementById("first_name").value.trim(),
        last_name: document.getElementById("last_name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        arrival, departure,
        guests: parseInt(document.getElementById("guests").value, 10)
      };
      let result;
      try { result = await createReservation(payload); }
      catch (err) { result = { ok: false, error: String(err) }; }
      if (result && result.ok) {
        sessionStorage.setItem("last_res", JSON.stringify({
          id: result.id, hotel_id: hotel.id, room_id: room.id, payload
        }));
        if (!DEMO) hotelsCache = null; // refresh availability next time
        else room.remaining = Math.max(0, room.remaining); // already decremented in demo
        location.hash = "#/success";
      } else {
        btn.disabled = false; btn.textContent = t("confirm_reservation");
        msg.textContent = result && result.error === "sold_out" ? t("room_just_sold_out") : t("reservation_failed");
      }
    });
  }

  async function viewSuccess() {
    const raw = sessionStorage.getItem("last_res");
    if (!raw) { location.hash = "#/"; return; }
    await ensureHotels();
    const data = JSON.parse(raw);
    const hotel = findHotel(data.hotel_id) || {};
    const found = findRoom(data.room_id);
    const roomName = found ? found.room.name : "";
    const p = data.payload;
    const nights = Math.max(1, Math.round((new Date(p.departure) - new Date(p.arrival)) / 86400000));

    app.innerHTML =
      '<div class="fade-in">' +
      '<section class="success-hero"><div class="ring">✓</div>' +
        "<h1>" + esc(t("success_title")) + "</h1><p>" + esc(t("success_sub")) + "</p></section>" +
      '<div class="summary-box"><div class="row"><span>' + esc(t("summary")) + "</span><span></span></div>" +
        '<div class="row"><span>Hotel</span><span>' + esc(hotel.name || "") + "</span></div>" +
        '<div class="row"><span>' + esc(t("room_types")) + "</span><span>" + esc(roomName) + "</span></div>" +
        '<div class="row"><span>' + esc(t("arrival")) + "</span><span>" + esc(fmtDate(p.arrival)) + "</span></div>" +
        '<div class="row"><span>' + esc(t("departure")) + "</span><span>" + esc(fmtDate(p.departure)) + "</span></div>" +
        '<div class="row"><span>' + esc(t("guests")) + "</span><span>" + p.guests + "</span></div>" +
        '<div class="row"><span></span><span>' + nights + " " + esc(nights === 1 ? t("night") : t("nights")) + "</span></div>" +
        '<div class="row"><span>' + esc(t("email")) + "</span><span>" + esc(p.email) + "</span></div>" +
      "</div>" +
      '<div class="info-card"><h3>' + esc(t("what_next")) + "</h3><p>" + esc(t("next_steps")) + "</p></div>" +
      '<div class="info-card"><h3>' + esc(t("hotel_contact")) + "</h3>" +
        "<p>" + esc(hotel.name || "") + "<br>" +
        (hotel.phone ? '<a href="tel:' + esc(hotel.phone) + '">' + esc(hotel.phone) + "</a><br>" : "") +
        (hotel.email ? '<a href="mailto:' + esc(hotel.email) + '">' + esc(hotel.email) + "</a>" : "") + "</p>" +
        '<iframe class="map-frame" loading="lazy" title="Map" src="' + mapsEmbed(hotel.lat, hotel.lng, hotel.address || hotel.name) + '"></iframe></div>' +
      '<div style="text-align:center;margin:30px 0 40px"><a class="btn secondary" href="#/">' + esc(t("back_home")) + "</a></div></div>";
    window.scrollTo(0, 0);
  }

  /* ---------- Form field helpers ---------- */
  function field(id, label, type, autocomplete, required) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + "</label>" +
      '<input id="' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + autocomplete + '"' +
      (required === false ? "" : " required") + "></div>";
  }
  function dateField(id, label, def) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + "</label>" +
      '<input id="' + id + '" name="' + id + '" type="date" value="' + def + '" required></div>';
  }
  function addDays(iso, n) {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  async function ensureHotels() {
    if (!hotelsCache) {
      app.innerHTML = '<div class="skeleton" style="margin-top:30px"></div>';
      try { await loadHotels(); }
      catch (e) { app.innerHTML = '<div class="notice" style="margin-top:30px">' + esc(t("error_loading")) + "</div>"; throw e; }
    }
  }

  /* ---------- Router ---------- */
  function route() {
    renderChrome();
    const hash = location.hash || "#/";
    const parts = hash.replace(/^#\//, "").split("/");
    document.body.classList.toggle("landing-active", !["hotels", "hotel", "reserve", "success"].includes(parts[0]));
    if (parts[0] === "hotels") return viewHotels();
    if (parts[0] === "hotel" && parts[1]) return viewHotel(decodeURIComponent(parts[1]));
    if (parts[0] === "reserve" && parts[1]) return viewReserve(decodeURIComponent(parts[1]));
    if (parts[0] === "success") return viewSuccess();
    return viewHome();
  }
  window.addEventListener("hashchange", route);
  route();
})();
