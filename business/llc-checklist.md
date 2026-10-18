# Forming Bryo Studio LLC (Texas)

A single-member Texas LLC, then a Google Play organization account in its
name. Written on 2026-10-18 as a working checklist. General information, not
legal or tax advice: check each form's current instructions when filing, and
consider an hour with a Texas CPA or small-business lawyer.

This file lives outside `site/`, so it is never published. The repository is
private, but even so: **record only reference numbers here** (filing number,
D-U-N-S). Keep the EIN letter, bank details, logins and anything with a
Social Security number in a password manager or other private place, not in
git.

Status key: `[ ]` to do, `[x]` done.

## 1. Before filing

- [ ] **Name check.** Search the Texas Secretary of State's registry on
  [SOSDirect](https://www.sos.state.tx.us/corp/sosda/index.shtml) for
  "Bryo Studio". The legal name needs "LLC", "L.L.C." or "Limited Liability
  Company": **Bryo Studio LLC**.
  - Optional: reserve it for 120 days (Form 501, $40). Only worth it if
    filing is more than a few weeks away.
- [ ] **Registered agent.** A Texas street address that accepts legal
  papers in business hours. Being your own costs nothing but puts that
  address on the public record. A commercial agent keeps your home address
  private. See [Choosing a registered agent](#choosing-a-registered-agent).
- [ ] **Business address** for the filing, D-U-N-S and Google Play. If you
  don't want your home address on those records, use the agent's address if
  their plan allows it, or a separate business address.
- [ ] **Management:** member-managed, with you as the only member. You're
  listed on the filing as the "governing person", with an address, which is
  public.

## 2. Forming it

- [ ] **File the Certificate of Formation, Form 205**, online through
  SOSDirect. **$300.** Usually a few business days; expedited is about $25
  more.
  - Filing date: ____
  - SOS file number: ____
- [ ] **Save the filed certificate** (PDF). Banks and Dun & Bradstreet ask
  for it.
- [ ] **Company agreement** (Texas's name for an operating agreement). Not
  filed and not required by law, but banks often ask for it, and it shows
  the LLC is run as a separate business. A short single-member template is
  enough.
- [ ] **EIN** from the IRS website: free, issued in minutes. Keep the
  confirmation letter (CP 575) somewhere private. Use the EIN, not your Social
  Security number, for the bank and Google's payment profile.
- [ ] **Business bank account** in the LLC's name: bring the certificate,
  the EIN letter and the company agreement. Keep the studio's money and
  spending in it only; mixing personal and business money weakens the
  liability protection.

## 3. Google Play

- [ ] **D-U-N-S number** for Bryo Studio LLC: free from Dun & Bradstreet's
  page for Google Play and Apple developers. Can take up to a few weeks. The
  legal name and address must match the Texas filing exactly.
  - D-U-N-S number: ____
- [ ] **Play organization account:** legal name Bryo Studio LLC, the
  D-U-N-S number, website `https://bryostudio.com`, contact
  `support@bryostudio.com`. The store can show "Bryo Studio" as the
  developer name.
- [ ] **Transfer Pizza Ambulance** from the personal developer account to the
  organization account, if it was started under the personal one. Installs,
  reviews and the package name (`com.bryostudio.pizzaambulance`) go with it.
- [ ] **Update the privacy pages** if the legal name should appear there
  ("Bryo Studio LLC").

## 4. Every year

- [ ] **Texas franchise tax.** Every LLC is subject to it, but below the "no
  tax due" revenue threshold (about $2.47 million recently, adjusted every two
  years) nothing is owed. Since 2024, entities under the threshold no longer
  file the No Tax Due report, but **still file a Public Information Report
  every year by May 15**, starting the year after formation. Missing it can
  eventually forfeit the LLC. Check the Comptroller's current rules.
- [ ] **Federal taxes.** A single-member LLC is "disregarded" by default: its
  profit goes on your personal return (Schedule C), with self-employment tax.
- [ ] **Registered agent renewal**, if you use a paid one. Check the renewal
  price, not the first-year price.
- No state income tax in Texas, and no yearly Secretary of State fee.
- **Sales tax:** Google is the seller of record for Play sales and handles
  that tax. A Texas sales tax permit is only needed for things sold directly
  (merchandise, say).
- **Federal ownership (BOI) reports:** dropped for US-formed companies in
  2025, as understood when this was written. It has changed more than once,
  so check before relying on it.

## Choosing a registered agent

Every state requires one, and many companies offer it nationwide. The Texas
Secretary of State doesn't run or endorse agents; it only requires that you
name one with a Texas street address.

**Where to look.** Search "Texas registered agent service" and compare a few
rather than taking the first (results are full of paid ads). National
providers that cover Texas and are widely used by small LLCs:

- Northwest Registered Agent
- Registered Agents Inc.
- ZenBusiness
- Bizee (formerly Incfile)
- LegalZoom
- Harbor Compliance
- CT Corporation (aimed at bigger companies, and pricier)

Or a Texas lawyer or CPA, if you hire one for the setup: many will act as
your agent, or recommend one.

**What to compare.**

- **The yearly price after any first-year deal.** Watch for "free first
  year" offers that renew much higher.
- **Mail scanning.** Good services scan legal papers and email them the same
  day; some also scan ordinary mail, sometimes for an extra fee.
- **Using their address beyond the agent role**: as the business address on
  the filing, with D-U-N-S and on Google Play. That is what keeps your home
  address off those records. Some include it; some sell it separately as a
  "virtual address".
- **Upselling.** Many bundle formation services, compliance alerts and the
  like. You only need the agent part: Form 205 can be filed yourself on
  SOSDirect for $300.
- **Switching away later.** Changing agents in Texas means filing a short
  change form with the Secretary of State.

**One caution for Google Play.** Play shows a business address publicly on
paid apps. Some services' addresses are known mail-drop addresses, and
Google or Dun & Bradstreet occasionally question those. **Before signing up,
ask the provider whether its address is accepted for D-U-N-S and Google
Play.** Prices change often; check each provider's site when ready.

## Costs at a glance

| Item | Cost |
|---|---|
| Certificate of Formation (Form 205) | $300, once |
| Name reservation (Form 501) | $40, optional |
| Registered agent | $0 (yourself) or a yearly fee |
| EIN | free |
| D-U-N-S number | free |
| Public Information Report | free, yearly |

## Already done

- [x] Domain `bryostudio.com` on Netlify, with the site and privacy pages.
- [x] Google Workspace on the domain, with `hello@`, `privacy@`, `support@`
  and `dmarc@` (2026-10-17). DNS: verification, MX, SPF, DKIM and DMARC
  (report only; tighten to `p=quarantine` after a few weeks of clean
  reports).
