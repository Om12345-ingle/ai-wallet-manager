# User & Reviewer Feedback Summary

## Collection

The production app includes a feedback form under **Feedback**. Each submission
records a Vercel Analytics custom event named `user_feedback_submitted` with:

- a 1–5 rating;
- the reviewed product area;
- an actionable comment capped at 200 characters;
- whether a wallet was connected.

No wallet secret, seed phrase, email address, or full wallet address is
collected.

## Initial External Review

Six issues were captured in the project review sheet and addressed:

| Theme | Feedback | Product Response |
|---|---|---|
| AI usability | Natural-language commands failed too often | Added fast command parsing plus LLM fallback |
| Information architecture | Chat needed its own workspace | Added a dedicated AI Chat page |
| Navigation | The top navigation appeared on every page | Scoped the full header to the dashboard |
| Mobile UX | Mobile layout was difficult to use | Added responsive navigation and mobile safe areas |
| Contacts | Users could not save recipients | Added contact management |
| Payments | Sending to a friend was unclear | Added contact-based send actions and guided chat |

## Level 5 Collection Status

The in-product collection mechanism and the formula-driven
[`level-5-user-feedback.xlsx`](level-5-user-feedback.xlsx) workbook are ready.
Google Forms was intentionally skipped at the project owner's request. The final
summary will be updated only after the real 50-wallet study.

Report these values after collection:

- response count and average rating;
- number of confirmed and verified transactions;
- compliance with the 2–3 minute interaction interval;
- most common positive theme and friction point;
- selected product change and its Git commit link.

No participant response has been invented for this document.
