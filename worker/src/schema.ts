import {
  doublePrecision,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const venues = pgTable("venues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  hours: jsonb("hours").notNull(),
});

export const amenities = pgTable("amenities", {
  venueId: text("venue_id")
    .primaryKey()
    .references(() => venues.id, { onDelete: "cascade" }),
  plugs: text("plugs").notNull(),
  wifi: text("wifi").notNull(),
  parking: text("parking").notNull(),
  groups: text("groups").notNull(),
  calls: text("calls").notNull(),
});

export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  venueId: text("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  locale: text("locale").notNull(),
});

export const pulses = pgTable("pulses", {
  id: uuid("id").primaryKey(),
  venueId: text("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" }),
  at: timestamp("at", { withTimezone: true }).notNull(),
  confidence: text("confidence").notNull(),
  note: text("note"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
});

export const venueSuggestions = pgTable("venue_suggestions", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  note: text("note"),
  locale: text("locale").notNull(),
  status: text("status").notNull().default("pending"),
  ipHash: text("ip_hash"),
  submittedBy: text("submitted_by"),
  submittedByEmail: text("submitted_by_email"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifiers = pgTable("verifiers", {
  userId: text("user_id").primaryKey(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const signals = pgTable("signals", {
  id: uuid("id").primaryKey(),
  pulseId: uuid("pulse_id")
    .notNull()
    .references(() => pulses.id, { onDelete: "cascade" }),
  venueId: text("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" }),
  attribute: text("attribute").notNull(),
  value: text("value").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull(),
});
