# Add Museums & Exhibits category

## Goal
Add a second content category to Happenly so users can browse Bay Area museum exhibits alongside concerts. Keep the existing concert experience intact.

## What we will build

### 1. Database
- Add a `category` column to `public.events` (`text not null default 'concerts'`).
- Add an index on `events(category, date)` for fast filtering.
- Existing events stay as `concerts`.

### 2. Data model
- Rename the `Concert` type to `Event` (alias `Concert` for compatibility) and add `category`.
- Add a `MUSEUM_TYPES` array (Art, History, Science, Photography, Design, Special Exhibition, etc.) used for museums/exhibits instead of music genres.

### 3. Venues & scraping
- Add `category` to `VenueSource` (default `concerts`).
- Add Bay Area museum/exhibit venues to `src/data/venues.ts`:
  - SFMOMA, de Young Museum, Legion of Honor, Asian Art Museum, Exploratorium, California Academy of Sciences, Contemporary Jewish Museum, Museum of Craft and Design, Yerba Buena Center for the Arts, Oakland Museum of California, Berkeley Art Museum / Pacific Film Archive (BAMPFA), UC Berkeley Art Museum, Lawrence Hall of Science, Chabot Space & Science Center, San Jose Museum of Art, The Tech Interactive, Computer History Museum, Cantor Arts Center, San Jose Museum of Quilts & Textiles, Museum of Palo Alto, etc.
- Update `scrape-events.server.ts` to:
  - Pass `category` through to the database.
  - Use museum-specific extraction prompts when `category === 'museums_exhibits'`.
  - Use museum type tags (exhibit type) instead of music genres.

### 4. UI changes
- Add category tabs/chips on the homepage: **Concerts** and **Museums & Exhibits**.
- When the museum category is active:
  - Hero title/subhead change to museums/exhibits language.
  - Search placeholder changes to "Search exhibitions, museums, cities…".
  - Genre filter becomes "Exhibit type" with museum types.
  - "All concerts" section title becomes "All exhibits".
  - Card label changes: "artist" field becomes exhibit title; "Tickets" button becomes "Get tickets" / "Visit".
- Keep concert experience identical when concerts category is active.

### 5. Server functions
- Update `getEvents` to select and return the `category` column.

### 6. Preferences / For you
- Keep preferences as-is for now; the museum category is browsable on the homepage. A future iteration can add category-specific preferences.

## Out of scope
- Separate route pages for museums (use category filter on index).
- Email digest category filtering (parked with newsletter).
- Map view or calendar view.

## Verification
- Run a full scrape after migration to backfill concerts with category and add museum rows.
- Confirm the homepage shows category tabs and switching filters works.
- Confirm the database has both `concerts` and `museums_exhibits` rows.
