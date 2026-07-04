/* Admin dashboard. Requires Supabase to be connected (see SETUP-GUIDE). */

(function () {
  "use strict";

  const DEMO = !CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.startsWith("PASTE");
  const el = document.getElementById("adminApp");
  const logoutBtn = document.getElementById("logoutBtn");
  const AMENITIES = ["wifi", "pool", "breakfast", "parking", "ac", "spa", "restaurant", "beach", "gym"];

  if (DEMO) {
    el.innerHTML =
      '<div class="admin-card"><h2>Admin dashboard</h2>' +
      '<p>The database isn\'t connected yet, so the dashboard can\'t run. ' +
      'Follow the SETUP-GUIDE to connect Supabase (about 15 minutes), then come back here to log in, ' +
      'add your real hotels and see reservations.</p></div>';
    return;
  }

  const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  let hotels = [], reservations = [], tab = "hotels";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Auth ---------- */
  async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return renderLogin();
    logoutBtn.style.display = "";
    await refreshAll();
    render();
  }
  logoutBtn.addEventListener("click", async () => {
    await sb.auth.signOut();
    location.reload();
  });

  function renderLogin() {
    el.innerHTML =
      '<div class="admin-card" style="max-width:420px;margin:40px auto">' +
      "<h2>Log in</h2>" +
      '<form id="loginForm">' +
      '<div class="field"><label for="lEmail">Email</label><input id="lEmail" type="email" autocomplete="username" required></div>' +
      '<div class="field"><label for="lPass">Password</label><input id="lPass" type="password" autocomplete="current-password" required></div>' +
      '<div class="form-msg" id="loginMsg"></div>' +
      '<button class="btn block" type="submit">Log in</button></form></div>';
    document.getElementById("loginForm").addEventListener("submit", async e => {
      e.preventDefault();
      const { error } = await sb.auth.signInWithPassword({
        email: document.getElementById("lEmail").value.trim(),
        password: document.getElementById("lPass").value
      });
      if (error) document.getElementById("loginMsg").textContent = "Wrong email or password.";
      else location.reload();
    });
  }

  /* ---------- Data ---------- */
  async function refreshAll() {
    const [h, r] = await Promise.all([
      sb.from("hotels").select("*, rooms(*)").order("sort_order"),
      sb.from("reservations").select("*, hotels(name), rooms(name)").order("created_at", { ascending: false })
    ]);
    hotels = h.data || [];
    hotels.forEach(x => x.rooms = (x.rooms || []).sort((a, b) => (a.price || 0) - (b.price || 0)));
    reservations = r.data || [];
  }

  /* ---------- Layout ---------- */
  function render() {
    const active = reservations.filter(r => r.status === "confirmed").length;
    const roomsLeft = hotels.reduce((s, h) => s + h.rooms.reduce((x, r) => x + (r.remaining || 0), 0), 0);
    el.innerHTML =
      '<div class="stat-grid">' +
        stat(hotels.length, "Hotels") + stat(active, "Active reservations") + stat(roomsLeft, "Rooms left") +
      "</div>" +
      '<div class="tabbar">' + tabBtn("hotels", "Hotels") + tabBtn("reservations", "Reservations") + "</div>" +
      '<div id="tabContent"></div>';
    el.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => { tab = b.dataset.tab; render(); }));
    if (tab === "hotels") renderHotels(); else renderReservations();
  }
  function stat(n, label) { return '<div class="stat"><div class="num">' + n + '</div><div class="lab">' + label + "</div></div>"; }
  function tabBtn(id, label) {
    return '<button class="chip ' + (tab === id ? "active" : "") + '" data-tab="' + id + '">' + label + "</button>";
  }

  /* ---------- Hotels tab ---------- */
  function renderHotels() {
    const c = document.getElementById("tabContent");
    c.innerHTML =
      '<div class="admin-card"><div class="admin-row" style="border:none;padding-bottom:0">' +
      "<h2>Hotels</h2>" +
      '<button class="btn small" id="addHotelBtn">+ Add hotel</button></div>' +
      hotels.map(h =>
        '<div class="admin-row"><div><strong>' + esc(h.name) + "</strong>" +
        '<div style="font-size:13.5px;color:var(--grigio)">' +
        h.rooms.map(r => esc(r.name) + ": " + (r.remaining || 0) + "/" + (r.total || 0) + " left").join(" · ") +
        (h.active ? "" : " · <b>hidden</b>") + "</div></div>" +
        '<div class="admin-actions">' +
        '<button class="btn small ghost" data-edit="' + h.id + '">Edit</button>' +
        '<button class="btn small ghost" data-rooms="' + h.id + '">Rooms</button></div></div>'
      ).join("") + "</div>" +
      '<div id="editor"></div>';
    c.querySelector("#addHotelBtn").addEventListener("click", () => hotelForm(null));
    c.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => hotelForm(hotels.find(h => String(h.id) === b.dataset.edit))));
    c.querySelectorAll("[data-rooms]").forEach(b => b.addEventListener("click", () => roomsEditor(hotels.find(h => String(h.id) === b.dataset.rooms))));
  }

  function hotelForm(h) {
    const box = document.getElementById("editor");
    const v = k => esc(h ? (h[k] == null ? "" : h[k]) : "");
    box.innerHTML =
      '<div class="admin-card"><h2>' + (h ? "Edit hotel" : "Add hotel") + "</h2>" +
      '<form id="hotelForm">' +
      inp("name", "Hotel name", v("name")) +
      '<div class="two-col">' + inp("stars", "Stars (1 to 5)", v("stars"), "number") + inp("price_from", "Price from (€ per night)", v("price_from"), "number") + "</div>" +
      '<div class="two-col">' + inp("distance_km", "Distance from venue (km)", v("distance_km"), "number") + inp("travel_minutes", "Travel time (minutes)", v("travel_minutes"), "number") + "</div>" +
      inp("address", "Address", v("address")) +
      '<div class="two-col">' + inp("lat", "Latitude", v("lat"), "number") + inp("lng", "Longitude", v("lng"), "number") + "</div>" +
      '<div class="two-col">' + inp("phone", "Hotel phone", v("phone")) + inp("email", "Hotel email", v("email")) + "</div>" +
      '<div class="field"><label>Amenities</label><div class="amenity-row">' +
        AMENITIES.map(a => '<label class="amenity" style="cursor:pointer"><input type="checkbox" name="am" value="' + a + '"' +
          (h && (h.amenities || []).includes(a) ? " checked" : "") + "> " + a + "</label>").join("") +
      "</div></div>" +
      area("description_en", "Description (English)", v("description_en")) +
      area("description_pt", "Description (Portuguese, optional)", v("description_pt")) +
      area("description_it", "Description (Italian, optional)", v("description_it")) +
      area("cancellation_en", "Cancellation policy (English)", v("cancellation_en")) +
      area("cancellation_pt", "Cancellation policy (Portuguese, optional)", v("cancellation_pt")) +
      area("cancellation_it", "Cancellation policy (Italian, optional)", v("cancellation_it")) +
      '<div class="field"><label>Photos</label>' +
        '<div id="photoList" style="display:flex;gap:8px;flex-wrap:wrap"></div>' +
        '<input type="file" id="photoFile" accept="image/*" style="margin-top:8px">' +
        '<p style="font-size:13px;color:var(--grigio)">Choose a photo from your phone or computer. It uploads automatically.</p></div>' +
      '<div class="field"><label><input type="checkbox" id="activeBox"' + (!h || h.active ? " checked" : "") + "> Show this hotel on the website</label></div>" +
      '<div class="form-msg" id="hotelMsg"></div>' +
      '<div class="admin-actions"><button class="btn" type="submit">Save hotel</button>' +
      '<button class="btn ghost" type="button" id="cancelEdit">Close</button></div>' +
      "</form></div>";
    box.scrollIntoView({ behavior: "smooth" });

    let photos = h ? (h.photos || []).slice() : [];
    function drawPhotos() {
      const pl = document.getElementById("photoList");
      pl.innerHTML = photos.map((p, i) =>
        '<span style="position:relative"><img src="' + esc(p) + '" style="width:90px;height:64px;object-fit:cover;border-radius:8px">' +
        '<button type="button" data-del="' + i + '" style="position:absolute;top:-6px;right:-6px;border:none;background:var(--terra);color:#fff;border-radius:50%;width:22px;height:22px;cursor:pointer">×</button></span>').join("");
      pl.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { photos.splice(+b.dataset.del, 1); drawPhotos(); }));
    }
    drawPhotos();

    document.getElementById("photoFile").addEventListener("change", async e => {
      const file = e.target.files[0];
      if (!file) return;
      const msg = document.getElementById("hotelMsg");
      msg.textContent = "Uploading photo…";
      const path = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const { error } = await sb.storage.from("hotel-photos").upload(path, file);
      if (error) { msg.textContent = "Upload failed: " + error.message; return; }
      const { data } = sb.storage.from("hotel-photos").getPublicUrl(path);
      photos.push(data.publicUrl);
      drawPhotos();
      msg.textContent = "Photo uploaded.";
      e.target.value = "";
    });

    document.getElementById("cancelEdit").addEventListener("click", () => box.innerHTML = "");
    document.getElementById("hotelForm").addEventListener("submit", async e => {
      e.preventDefault();
      const f = id => document.getElementById("f_" + id).value.trim();
      const num = id => f(id) === "" ? null : Number(f(id));
      const row = {
        name: f("name"), stars: num("stars"), price_from: num("price_from"),
        distance_km: num("distance_km"), travel_minutes: num("travel_minutes"),
        address: f("address"), lat: num("lat"), lng: num("lng"),
        phone: f("phone"), email: f("email"),
        amenities: Array.from(document.querySelectorAll('input[name="am"]:checked')).map(x => x.value),
        description_en: f("description_en"), description_pt: f("description_pt"), description_it: f("description_it"),
        cancellation_en: f("cancellation_en"), cancellation_pt: f("cancellation_pt"), cancellation_it: f("cancellation_it"),
        photos, active: document.getElementById("activeBox").checked
      };
      const msg = document.getElementById("hotelMsg");
      if (!row.name) { msg.textContent = "The hotel needs a name."; return; }
      const q = h ? sb.from("hotels").update(row).eq("id", h.id) : sb.from("hotels").insert(row);
      const { error } = await q;
      if (error) { msg.textContent = "Save failed: " + error.message; return; }
      await refreshAll(); render();
    });
  }

  function inp(id, label, val, type) {
    return '<div class="field"><label for="f_' + id + '">' + label + '</label>' +
      '<input id="f_' + id + '" type="' + (type || "text") + '" step="any" value="' + val + '"></div>';
  }
  function area(id, label, val) {
    return '<div class="field"><label for="f_' + id + '">' + label + '</label>' +
      '<textarea class="notes" id="f_' + id + '">' + val + "</textarea></div>";
  }

  /* ---------- Rooms editor ---------- */
  function roomsEditor(h) {
    const box = document.getElementById("editor");
    function draw() {
      box.innerHTML =
        '<div class="admin-card"><h2>Rooms · ' + esc(h.name) + "</h2>" +
        '<table class="admin-table"><tr><th>Room type</th><th>€ / night</th><th>Total</th><th>Left</th><th></th></tr>' +
        h.rooms.map(r =>
          "<tr>" +
          '<td><input class="notes" style="min-height:40px" data-f="name" data-id="' + r.id + '" value="' + esc(r.name) + '"></td>' +
          '<td><input class="notes" style="min-height:40px;width:90px" type="number" data-f="price" data-id="' + r.id + '" value="' + (r.price || 0) + '"></td>' +
          '<td><input class="notes" style="min-height:40px;width:70px" type="number" data-f="total" data-id="' + r.id + '" value="' + (r.total || 0) + '"></td>' +
          '<td><input class="notes" style="min-height:40px;width:70px" type="number" data-f="remaining" data-id="' + r.id + '" value="' + (r.remaining || 0) + '"></td>' +
          '<td><button class="btn small danger" data-delroom="' + r.id + '">Delete</button></td></tr>'
        ).join("") + "</table>" +
        '<div class="form-msg" id="roomMsg"></div>' +
        '<div class="admin-actions" style="margin-top:12px">' +
        '<button class="btn small" id="addRoom">+ Add room type</button>' +
        '<button class="btn small" id="saveRooms">Save changes</button>' +
        '<button class="btn small ghost" id="closeRooms">Close</button></div></div>';
      box.scrollIntoView({ behavior: "smooth" });

      box.querySelector("#closeRooms").addEventListener("click", () => box.innerHTML = "");
      box.querySelector("#addRoom").addEventListener("click", async () => {
        const { error } = await sb.from("rooms").insert({ hotel_id: h.id, name: "New room type", price: 100, total: 1, remaining: 1 });
        if (!error) { await refreshAll(); h = hotels.find(x => String(x.id) === String(h.id)); draw(); }
      });
      box.querySelectorAll("[data-delroom]").forEach(b => b.addEventListener("click", async () => {
        if (!confirm("Delete this room type? Existing reservations keep their record.")) return;
        await sb.from("rooms").delete().eq("id", b.dataset.delroom);
        await refreshAll(); h = hotels.find(x => String(x.id) === String(h.id)); draw();
      }));
      box.querySelector("#saveRooms").addEventListener("click", async () => {
        const updates = {};
        box.querySelectorAll("input[data-id]").forEach(i => {
          updates[i.dataset.id] = updates[i.dataset.id] || {};
          updates[i.dataset.id][i.dataset.f] = i.dataset.f === "name" ? i.value : Number(i.value);
        });
        for (const id in updates) await sb.from("rooms").update(updates[id]).eq("id", id);
        document.getElementById("roomMsg").textContent = "Saved.";
        await refreshAll(); h = hotels.find(x => String(x.id) === String(h.id));
        render();
      });
    }
    draw();
  }

  /* ---------- Reservations tab ---------- */
  function renderReservations() {
    const c = document.getElementById("tabContent");
    c.innerHTML =
      '<div class="admin-card"><div class="admin-row" style="border:none;padding-bottom:0"><h2>Reservations</h2>' +
      '<button class="btn small" id="csvBtn">Export CSV</button></div>' +
      '<div style="overflow-x:auto"><table class="admin-table"><tr>' +
      "<th>Guest</th><th>Hotel / Room</th><th>Dates</th><th>Guests</th><th>Status</th><th>Notes</th><th></th></tr>" +
      reservations.map(r =>
        "<tr><td><strong>" + esc(r.first_name + " " + r.last_name) + "</strong><br>" +
        '<a href="mailto:' + esc(r.email) + '">' + esc(r.email) + "</a>" + (r.phone ? "<br>" + esc(r.phone) : "") + "</td>" +
        "<td>" + esc(r.hotels ? r.hotels.name : "") + "<br>" + esc(r.rooms ? r.rooms.name : "") + "</td>" +
        "<td>" + esc(r.arrival) + " →<br>" + esc(r.departure) + "</td>" +
        "<td>" + (r.guests || "") + "</td>" +
        '<td><span class="tag ' + esc(r.status) + '">' + esc(r.status) + "</span></td>" +
        '<td style="min-width:180px"><textarea class="notes" data-note="' + r.id + '">' + esc(r.notes || "") + "</textarea>" +
        '<button class="btn small ghost" data-savenote="' + r.id + '" style="margin-top:6px">Save note</button></td>' +
        "<td>" + (r.status === "confirmed" ? '<button class="btn small danger" data-cancel="' + r.id + '">Cancel</button>' : "") + "</td></tr>"
      ).join("") + "</table></div></div>";

    c.querySelector("#csvBtn").addEventListener("click", exportCSV);
    c.querySelectorAll("[data-savenote]").forEach(b => b.addEventListener("click", async () => {
      const note = c.querySelector('textarea[data-note="' + b.dataset.savenote + '"]').value;
      await sb.from("reservations").update({ notes: note }).eq("id", b.dataset.savenote);
      b.textContent = "Saved ✓";
      setTimeout(() => b.textContent = "Save note", 1500);
    }));
    c.querySelectorAll("[data-cancel]").forEach(b => b.addEventListener("click", async () => {
      if (!confirm("Cancel this reservation? The room goes back into the available pool.")) return;
      const { error } = await sb.rpc("cancel_reservation", { p_reservation_id: b.dataset.cancel });
      if (error) alert("Could not cancel: " + error.message);
      await refreshAll(); render();
    }));
  }

  function exportCSV() {
    const head = ["First name", "Last name", "Email", "Phone", "Hotel", "Room", "Arrival", "Departure", "Guests", "Status", "Notes", "Created"];
    const rows = reservations.map(r => [
      r.first_name, r.last_name, r.email, r.phone || "",
      r.hotels ? r.hotels.name : "", r.rooms ? r.rooms.name : "",
      r.arrival, r.departure, r.guests, r.status, r.notes || "", r.created_at
    ]);
    const csv = [head].concat(rows).map(row =>
      row.map(cell => '"' + String(cell == null ? "" : cell).replace(/"/g, '""') + '"').join(",")
    ).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv" }));
    a.download = "reservations.csv";
    a.click();
  }

  init();
})();
