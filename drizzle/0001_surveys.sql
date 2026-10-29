CREATE TYPE "public"."survey_kind" AS ENUM('nps', 'csat', 'ces');--> statement-breakpoint
ALTER TYPE "public"."feedback_type" ADD VALUE 'rating';--> statement-breakpoint
ALTER TABLE "apps" ALTER COLUMN "widget" SET DEFAULT '{"color":"#2433F5","position":"right","language":"auto","label":"","askEmail":"optional","survey":"nps"}'::jsonb;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "survey" "survey_kind";--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "score" integer;