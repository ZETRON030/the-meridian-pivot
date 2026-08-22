#  the-meridian-pivot
 Individual - Northstar Retail Co. Live Inventory Sync Service
## Project Overview
This project is being developed by Ikechukwu Agoha of Group 22 as part of the Northstar (Sprint 2).

The Live Sync Service is designed to Keep Northstar's support tool's
"is this in stock?" answers accurate.

The goal of this sprint is not to grade the developer on a tool he knows.It grades him on what he does when he does not do anything.

Basically to Asertain;

Developer's ability to learn new tool independently under pressure.

Developer's Adaptive nature to changies in focus or idea when working on a project.

Possibilities of developer quiting when such difficult times arises.
## Owner
Ikechukwu Agoha
## Task Assessment
  1. measures whether you can teach yourself something new with no one to ask. 

  2. measures whether your team can absorb a real, sudden requirement change without quietly pretending nothing broke.

  3. measures whether you stayed steady, honest, and easy to work with when the plan changed under you.

## Prototype architecture

One Node.js application
+
One PostgreSQL database

## Core concepts demonstrated

- Inventory synchronization
- PostgreSQL transactions
- Transactional outbox
- Idempotency
- Source-version protection
- Background processing
- REST API

## Golding Rules
The unfamiliar tool must be genuinely new to the learner - no picking something they already half-know.

No teammate or instructor gives technical how-to help during Days 1–2 - that's what makes autonomy measurable.

The Day 4 pivot is delivered as final: no deadline extension, no negotiating scope back to the original spec.
Obsolete code from before the pivot must be visibly removed or marked deprecated - not left running in parallel.

## Pivot Event

Client:Solstice Events Co.
   
#  GOAL 
A mandatory technical shift for a badge-printing kiosk service being developed for Solstice Events Co.

Original Technology Stack: Synchronous model requiring QR code scanning.

The Pivot: The system has to be rebuilt to correct vendor's dupricating the synchronous API.

New Technology Stack: Asynchronous model were a print request will be published to a message queue and impelement a webhook endpoint to receive complete callback.

# Call to Action:
Using a new technology, provide the above solution for Solstice Events Co.

The Adaptability Index is confidential and never shared verbatim between teammates; only aggregate patterns may be released.

## Project Status
   Completed
