// Domain aliases over the GENERATED Supabase types (types/supabase.ts).
// Regenerate types/supabase.ts after every migration; these aliases keep
// app imports stable.

import type { Database } from './supabase';

export type { Database, Json } from './supabase';

type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

export type AttendeeVisibility = Enums['attendee_visibility'];
export type SessionType = Enums['session_type'];
export type QuestionStatus = Enums['question_status'];
export type ConnectionSource = Enums['connection_source'];
export type NotificationCategory = Enums['notification_type'];
export type AdminRole = Enums['admin_role'];

export type Event = Tables['events']['Row'];
export type Attendee = Tables['attendees']['Row'];
export type Speaker = Tables['speakers']['Row'];
export type SpeakerFollower = Tables['speaker_followers']['Row'];
export type Session = Tables['sessions']['Row'];
export type SessionSpeaker = Tables['session_speakers']['Row'];
export type SchedulePick = Tables['schedule_picks']['Row'];
export type Partner = Tables['partners']['Row'];
export type PartnerInterest = Tables['partner_interest']['Row'];
export type Connection = Tables['connections']['Row'];
export type PendingConnection = Tables['pending_connections']['Row'];
export type Note = Tables['notes']['Row'];
export type Question = Tables['questions']['Row'];
export type QuestionUpvote = Tables['question_upvotes']['Row'];
export type AuctionItem = Tables['auction_items']['Row'];
export type Bid = Tables['bids']['Row'];
export type AppNotification = Tables['notifications']['Row'];
export type NotificationRecipient = Tables['notification_recipients']['Row'];
export type GalleryItem = Tables['gallery_items']['Row'];
export type Faq = Tables['faqs']['Row'];
export type PodcastEpisode = Tables['podcast_episodes']['Row'];
export type DailySuggestion = Tables['daily_suggestions']['Row'];
export type AdminUser = Tables['admin_users']['Row'];
export type AuditLog = Tables['audit_log']['Row'];
export type CheckIn = Tables['check_ins']['Row'];
export type SyncRun = Tables['sync_runs']['Row'];
export type PublicQuestion = Database['public']['Views']['public_questions']['Row'];
