---
id: F-001
title: Working application delivered through the agent pipeline
issue:
stories: [US-0001, US-0002, US-0003, US-0004, US-0005, US-0006]
---

# Feature: working application delivered through the agent pipeline

## Why this feature exists
The product is secondary. The purpose is to prove a feature can travel from a written
intent to production through an agent team with human gates, with no local machine.

## Stories
| Story | Title | Type | Ready |
|---|---|---|---|
| US-0001 | Repository and delivery scaffold | enabler | yes |
| US-0002 | API and seed data | user | blocked on use case |
| US-0003 | Web UI | user | blocked on use case |
| US-0004 | Google sign-in with domain restriction | user | after 0002 and 0003 |
| US-0005 | Delivery pipeline to the dev namespace | enabler | after 0001, needs Azure |
| US-0006 | Production release gate and smoke tests | enabler | after 0005 |

## Definition of done
All four stories merged, deployed to the prod namespace through the gate, and reachable
at a public HTTPS URL restricted to the Workspace domain.
