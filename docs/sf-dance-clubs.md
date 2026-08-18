# SF dance clubs / DJ venues — research notes

Source list provided 2026-08-18, verified before adding any of these as scrape
targets (`venues` table / `src/data/venues.ts`). SF nightlife venues close and
rebrand often, so each one was checked for current operating status and a
real first-party events calendar before being added.

## Added as active scrape sources

| Venue | Address | Neighborhood | Notes | Calendar URL used |
|---|---|---|---|---|
| Public Works | 161 Erie St | Mission | Multi-room complex, sprung hardwood dance floor, Funktion-One sound system. Touring + local DJs. | publicsf.com/calendar/ |
| Monarch | 101 6th St | SoMa | House/techno focus; voted Best Sound System by SF Weekly. | monarchsf.com |
| F8 | 1192 Folsom St | SoMa | ~250 capacity, two rooms. Eclectic: house, hip-hop, techno, dubstep. | feightsf.com/new-events |
| Audio (Audio Discotech) | 316 11th St | SoMa | Funktion One 3D surround sound. House/dance focus. | audiosf.com/events |
| The Great Northern | 119 Utah St | Mission / Design District | Industrial/art-deco room, custom Void sound system. Label showcases, touring artists. | thegreatnorthernsf.com |
| Halcyon SF | 314 11th St | SoMa | House/techno club, Fri-Sat 10pm-4am, extended peak-time sets. | halcyon-sf.com |
| Underground SF | 424 Haight St | Lower Haight | Compact bar/café by day, techno/electro/house by night. Home of "Shelter" DnB night. | undergroundsf.com |
| 1015 Folsom | 1015 Folsom St | SoMa | Classic big-room club, touring DJs into early morning. | 1015.com |
| Eve Nightclub | 1535 Folsom St | SoMa | House/hip-hop, ~350 capacity. | evesf.com |
| YOLO Nightclub | 333 11th St | SoMa | Top-40/dance hits. | yolonightclub.com |
| Hawthorn | 46 Geary St | Union Square | House/EDM, dual-room (hip-hop room + electronic room), Void sound system. | hawthornsf.com/nightlife-events/ |
| Cat Club | 1190 Folsom St | SoMa | Long-running goth/industrial/80s club nights. | sfcatclub.com |
| The Valencia Room | 647 Valencia St | Mission | House/hip-hop; also hosts comedy (already a scrape source under the `comedy` category — added a second `concerts`-category entry for its club nights). | thevalenciaroom.com |

## Deliberately excluded (verify before adding)

| Venue | Why excluded |
|---|---|
| Temple | 540 Howard St, SoMa. Publicly announced a permanent closure in May 2024, but some 2026 listings (Yelp, travel guides) show it as still operating — conflicting signals, status unclear. Its calendar page is also JS-rendered and didn't return real content in a scrape test. |
| Monroe | 473 Broadway, North Beach. No first-party website with an events calendar found — only aggregator listings (Yelp, Eventbrite, RA). |
| The Grand | 520 4th St, SoMa. Same issue — no first-party calendar site found, only aggregators. |
| Love and Propaganda | 85 Campton Pl, Union Square. Confirmed **closed** (Yelp, March 2026). |
| Madarae | 46 Minna St, SoMa. Primarily a private-event/cocktail bar; public event listings live on Eventbrite/RA, not their own site — weak as a scrape source. |
| DNA Lounge | 375 11th St, SoMa. Already an existing scrape source (`concerts` category) — no action needed. |

If any of the excluded ones turn out to have reopened/relaunched with a real
calendar, they're good candidates to revisit.
