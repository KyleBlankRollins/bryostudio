---
layout: ../../layouts/Markdown.astro
title: "Ascribe privacy policy"
description: "Ascribe collects nothing: what it sends, when you run something that needs the network, and to whom."
---

# Ascribe privacy policy

<p class="updated">Effective and last updated: 20 October 2026</p>

<div class="note">
  <p>In short: Ascribe collects nothing. It has no telemetry, no crash reports and no account, calls no AI service, and sends nothing to Bryo Studio. It reaches the network only when you run something that needs it, and only to the services you point it at.</p>
</div>

This policy covers Ascribe, made by Bryo Studio (“we”, “us”): the `ascribe` command, the Ascribe extension for VS Code, the `@ascribed` packages on npm, and the website [ascribed-dev.com](https://ascribed-dev.com). The [Bryo Studio privacy policy](/privacy/) covers this website.

## What leaves your computer

Ascribe reads your project’s files and answers on your computer. These are the only things that send anything anywhere, and each happens only when you do it:

<table>
  <caption>When Ascribe reaches the network</caption>
  <thead>
    <tr>
      <th scope="col">When you</th>
      <th scope="col">What is sent</th>
      <th scope="col">To whom</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Review a pull request, in VS Code or the site preview</td>
      <td>The pull request’s comment threads are read, and the comments you write are posted, signed in as you</td>
      <td>GitHub</td>
    </tr>
    <tr>
      <td>Run <code>ascribe sources fetch</code> or <code>update</code></td>
      <td>A <code>git</code> fetch of the repositories your project’s <code>ascribe.toml</code> names</td>
      <td>Wherever those repositories are hosted</td>
    </tr>
    <tr>
      <td>Run <code>ascribe report links</code></td>
      <td>A request to each external link in your docs, made by lychee, a link checker you install</td>
      <td>The sites your docs link to</td>
    </tr>
    <tr>
      <td>Run <code>ascribe report agents</code></td>
      <td>Requests to your published site, made by afdocs, a checker you install</td>
      <td>Your site’s host</td>
    </tr>
    <tr>
      <td>Run <code>ascribe observe</code></td>
      <td>Whatever your project’s own test commands send; Ascribe runs them and sends nothing itself</td>
      <td>Your tests decide</td>
    </tr>
    <tr>
      <td>Install or update Ascribe</td>
      <td>The download</td>
      <td>npm, Homebrew, GitHub or the VS Code Marketplace, under their own policies</td>
    </tr>
  </tbody>
</table>

## AI assistants and agents

Ascribe calls no AI model and holds no key for one. When you use an AI coding agent with Ascribe, what Ascribe tells the agent, such as a page’s text or a list of problems, becomes part of what that agent sends to its model, as any file it reads does, under the agent’s own terms. A prompt Ascribe writes for your agent stays on your computer until you send it.

Ascribe’s documentation says more in [What’s sent where](https://ascribed-dev.com/docs/agents/#whats-sent-where).

## The website

[ascribed-dev.com](https://ascribed-dev.com) sets no cookies and runs no analytics or tracking. It is hosted by **Netlify**, whose servers, like any web server, see your IP address and browser details when you visit, and keep short-lived logs for running the service and keeping it secure. We do not use these logs to identify visitors.

## Questions

Write to [privacy@bryostudio.com](mailto:privacy@bryostudio.com).
