CREATE TYPE "public"."conversation_status" AS ENUM('open', 'resolved', 'escalated', 'pending_vet');--> statement-breakpoint
CREATE TYPE "public"."urgency_level" AS ENUM('L1', 'L2', 'L3', 'L4');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'audio', 'document', 'location');--> statement-breakpoint
CREATE TYPE "public"."sender_type" AS ENUM('contact', 'bot', 'staff');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending_confirmation', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."business_context_category" AS ENUM('faq', 'hours', 'services', 'prices', 'location', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."escalation_action" AS ENUM('notified_staff', 'vet_called', 'emergency_contact_sent', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"whatsapp_id" text NOT NULL,
	"display_name" text,
	"phone" text,
	"email" text,
	"pet_names" text[] DEFAULT '{}',
	"imported_from_gvet" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_whatsapp_id_unique" UNIQUE("whatsapp_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"whatsapp_thread_id" text NOT NULL,
	"status" "conversation_status" DEFAULT 'open' NOT NULL,
	"urgency_level" "urgency_level" DEFAULT 'L1' NOT NULL,
	"urgency_detected_at" timestamp with time zone,
	"assigned_to_staff" text,
	"summary" text,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_whatsapp_thread_id_unique" UNIQUE("whatsapp_thread_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"whatsapp_message_id" text NOT NULL,
	"sender_type" "sender_type" NOT NULL,
	"message_type" "message_type" DEFAULT 'text' NOT NULL,
	"body" text,
	"media_url" text,
	"media_type" text,
	"ai_analysis" text,
	"urgency_signal" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_whatsapp_message_id_unique" UNIQUE("whatsapp_message_id")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"conversation_id" uuid,
	"pet_name" text NOT NULL,
	"pet_species" text,
	"reason" text,
	"status" "appointment_status" DEFAULT 'pending_confirmation' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"staff_notes" text,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_of_week" integer,
	"specific_date" date,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_duration_minutes" integer DEFAULT 30 NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"label" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_context" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "business_context_category" NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_context_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "urgency_escalations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid,
	"urgency_level" "urgency_level" NOT NULL,
	"trigger_reason" text,
	"ai_summary" text,
	"action" "escalation_action",
	"action_taken_by" text,
	"action_taken_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "urgency_escalations" ADD CONSTRAINT "urgency_escalations_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "urgency_escalations" ADD CONSTRAINT "urgency_escalations_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;