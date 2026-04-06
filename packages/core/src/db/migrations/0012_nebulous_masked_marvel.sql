CREATE TABLE "checkin_type_ticket_types" (
	"id" text PRIMARY KEY NOT NULL,
	"checkin_type_id" text NOT NULL,
	"ticket_type_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_types" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"luma_ticket_type_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ticket_type_id" text;--> statement-breakpoint
ALTER TABLE "checkin_type_ticket_types" ADD CONSTRAINT "checkin_type_ticket_types_checkin_type_id_checkin_types_id_fk" FOREIGN KEY ("checkin_type_id") REFERENCES "public"."checkin_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_type_ticket_types" ADD CONSTRAINT "checkin_type_ticket_types_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkin_type_ticket_types_pair_unique" ON "checkin_type_ticket_types" USING btree ("checkin_type_id","ticket_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_types_code_unique" ON "ticket_types" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_types_luma_ticket_type_id_unique" ON "ticket_types" USING btree ("luma_ticket_type_id");--> statement-breakpoint
CREATE INDEX "ticket_types_is_active_idx" ON "ticket_types" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_ticket_type_id_idx" ON "users" USING btree ("ticket_type_id");