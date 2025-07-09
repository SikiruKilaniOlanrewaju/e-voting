-- Migration: Add locked column to voting_events for admin result locking
ALTER TABLE voting_events ADD COLUMN locked boolean DEFAULT false;
