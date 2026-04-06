ALTER TABLE "users" DROP CONSTRAINT "users_ticket_type_id_ticket_types_id_fk";
--> statement-breakpoint
ALTER TABLE "checkin_type_ticket_types" DROP CONSTRAINT "checkin_type_ticket_types_ticket_type_id_ticket_types_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_type_ticket_types" ADD CONSTRAINT "checkin_type_ticket_types_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE restrict ON UPDATE no action;