# Wedding Hotel Website: Setup Guide

Everything technical is already built. You only need to do 4 things:
preview it, personalize it, connect the database, and put it online.
Total time: about 25 minutes.

---

## Part 1: Preview it right now (1 minute)

1. Unzip the folder.
2. Double-click the file called **index.html**.
3. It opens in your browser in **Demo Mode** with 3 sample hotels.
   You can click through the whole experience, switch languages,
   and even make a fake reservation.

Demo Mode reservations are not saved anywhere. That's expected.

---

## Part 2: Personalize it (5 minutes)

1. Open the folder **js**, then open the file **config.js**.
   On a Mac, right-click it, choose Open With, then TextEdit.
   On Windows, right-click it, choose Open With, then Notepad.
2. Change the text between the quotation marks:
   your names, the wedding date, the venue name and address,
   the welcome messages, and the photo link.
3. Save the file and open index.html again to see your changes.

Tip for the hero photo: upload a photo of you two anywhere public
(for example Google Photos shared link, or later the admin dashboard)
and paste the link. Or send me the photo and I'll set it up.

Tip for the venue map position (latitude and longitude):
open Google Maps, right-click on your venue, and the first line
in the menu shows two numbers. The first is latitude, the second
is longitude. Copy them into config.js.

---

## Part 3: Connect the database (15 minutes)

The database is what saves reservations and keeps room counts
accurate so no room gets double-booked. We use a free service
called Supabase.

1. Go to **supabase.com** and click **Start your project**.
   Sign up with your email or Google account. It's free.
2. Click **New project**.
   - Name: wedding-site (or anything)
   - Database password: invent a strong one and save it somewhere
   - Region: choose **Europe (Frankfurt)** since guests are in Europe
   - Click **Create new project** and wait about 2 minutes.
3. In the left menu, click the icon called **SQL Editor**.
4. Open the file **supabase-setup.sql** from this folder,
   select ALL the text, copy it, paste it into the SQL Editor,
   and click **Run** (bottom right). You should see "Success".
5. Create your admin login:
   - In the left menu click **Authentication**, then **Users**.
   - Click **Add user**, then **Create new user**.
   - Enter YOUR email and invent a password. Click **Create user**.
   - This is what you'll use to log in to the admin dashboard.
6. Get your two connection codes:
   - In the left menu click the gear icon (**Project Settings**),
     then **API** (it may be called "API Keys" or "Data API").
   - Copy the **Project URL** (starts with https:// and ends
     with supabase.co).
   - Copy the **anon public** key (a long block of letters).
7. Open **js/config.js** again and replace:
   - PASTE_YOUR_SUPABASE_URL_HERE with the Project URL
   - PASTE_YOUR_SUPABASE_ANON_KEY_HERE with the anon key
   Keep the quotation marks around them. Save the file.

Done. Open index.html again: the demo banner is gone and the site
now talks to your database. It will show no hotels yet, which is
normal. You'll add them in Part 5.

---

## Part 4: Put it online (5 minutes)

Easiest way, no account linking needed:

1. Go to **app.netlify.com/drop** in your browser.
2. Drag the whole website folder onto the page.
3. Wait a few seconds. Netlify gives you a link like
   https://something.netlify.app
4. That link is your live website. Share it with guests.
5. To get a nicer name: sign up for the free Netlify account it
   offers, then in Site settings choose **Change site name**
   (for example giulia-e-marco.netlify.app).

Alternative: you've used GitHub + Vercel before. Uploading this
folder to a new GitHub repository and importing it in Vercel works
exactly the same way as your mountain app. Ask me and I'll walk
you through it click by click.

Important: whenever you change config.js later, drag the folder
onto Netlify Drop again (or push to GitHub) to update the live site.

---

## Part 5: Add your real hotels (10 minutes)

1. Open your live website address and add **/admin.html** at the
   end. Example: https://giulia-e-marco.netlify.app/admin.html
2. Log in with the email and password you created in Part 3, step 5.
3. Click **+ Add hotel** and fill in the form:
   - Name, stars, price from, distance and travel time
   - Address plus latitude and longitude (same Google Maps trick
     as in Part 2)
   - Hotel phone and email (shown to guests after they reserve)
   - Tick the amenities
   - Write the English description. Portuguese and Italian are
     optional; if you leave them empty, guests see the English one.
     I'm happy to translate them for you.
   - Add photos with the photo button. They upload automatically.
4. Click **Save hotel**, then click **Rooms** next to the hotel:
   - Add each room type with its price per night
   - **Total** = how many rooms the hotel reserved for you
   - **Left** = how many are still available (starts equal to Total)
5. Repeat for each hotel.

The **Reservations** tab shows every booking as guests reserve.
From there you can export a CSV for the hotels, cancel a
reservation (the room automatically goes back into the pool),
and add private notes.

---

## How reservations work (so you can explain it to hotels)

- A guest reserves a room type on the site. The available count
  drops by one instantly, for everyone, so overbooking can't happen.
- The guest sees a confirmation screen with the hotel's phone and
  email, and is told the hotel will contact them to confirm and
  arrange payment directly.
- Once a week (or whenever), export the CSV and send each hotel
  its list of guests. Or check the dashboard from your phone.

---

## If something goes wrong

- Site shows "We couldn't load the hotels": the URL or key in
  config.js was pasted wrong. Re-copy both from Supabase.
- Can't log in to admin: re-check the user you created in
  Authentication → Users, or create a new one.
- Anything else: come back to me, describe what you see, and
  I'll fix it.
