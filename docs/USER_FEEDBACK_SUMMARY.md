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

## Current Baseline

The collection mechanism is production-ready. A final submission summary should
be updated after 10 real participants complete the onboarding study. Report the
response count, average rating, most common positive theme, most common friction
point, and the next product change—without inventing responses.
