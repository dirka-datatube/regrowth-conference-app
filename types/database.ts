// Hand-written type stubs that match supabase/migrations/20260101000000_initial_schema.sql.
// Replace with generated types via `npm run supabase:types` once the project is linked.

export type Database = {
  public: {
    Tables: {
      events: { Row: Event; Insert: Partial<Event>; Update: Partial<Event> };
      attendees: { Row: Attendee; Insert: Partial<Attendee>; Update: Partial<Attendee> };
      speakers: { Row: Speaker; Insert: Partial<Speaker>; Update: Partial<Speaker> };
      speaker_followers: { Row: SpeakerFollower; Insert: SpeakerFollower; Update: Partial<SpeakerFollower> };
      sessions: { Row: Session; Insert: Partial<Session>; Update: Partial<Session> };
      session_speakers: { Row: SessionSpeaker; Insert: SessionSpeaker; Update: Partial<SessionSpeaker> };
      schedule_picks: { Row: SchedulePick; Insert: SchedulePick; Update: Partial<SchedulePick> };
      partners: { Row: Partner; Insert: Partial<Partner>; Update: Partial<Partner> };
      partner_interest: { Row: PartnerInterest; Insert: Partial<PartnerInterest>; Update: Partial<PartnerInterest> };
      connections: { Row: Connection; Insert: Partial<Connection>; Update: Partial<Connection> };
      pending_connections: { Row: PendingConnection; Insert: Partial<PendingConnection>; Update: Partial<PendingConnection> };
      notes: { Row: Note; Insert: Partial<Note>; Update: Partial<Note> };
      questions: { Row: Question; Insert: Partial<Question>; Update: Partial<Question> };
      question_upvotes: { Row: QuestionUpvote; Insert: QuestionUpvote; Update: Partial<QuestionUpvote> };
      auction_items: { Row: AuctionItem; Insert: Partial<AuctionItem>; Update: Partial<AuctionItem> };
      bids: { Row: Bid; Insert: Partial<Bid>; Update: Partial<Bid> };
      notifications: { Row: AppNotification; Insert: Partial<AppNotification>; Update: Partial<AppNotification> };
      notification_recipients: { Row: NotificationRecipient; Insert: NotificationRecipient; Update: Partial<NotificationRecipient> };
      gallery_items: { Row: GalleryItem; Insert: Partial<GalleryItem>; Update: Partial<GalleryItem> };
      faqs: { Row: Faq; Insert: Partial<Faq>; Update: Partial<Faq> };
      podcast_episodes: { Row: PodcastEpisode; Insert: Partial<PodcastEpisode>; Update: Partial<PodcastEpisode> };
      daily_suggestions: { Row: DailySuggestion; Insert: Partial<DailySuggestion>; Update: Partial<DailySuggestion> };
      admin_users: { Row: AdminUser; Insert: Partial<AdminUser>; Update: Partial<AdminUser> };
      audit_log: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
    };
  };
};

export type AttendeeVisibility = 'public' | 'connections_only' | 'hidden';
export type SessionType =
  | 'keynote'
  | 'panel'
  | 'workshop'
  | 'breakout'
  | 'meal'
  | 'social'
  | 'admin';
export type QuestionStatus = 'pending' | 'approved' | 'rejected' | 'answered';
export type ConnectionSource = 'qr_scan' | 'business_card' | 'manual' | 'suggested';
export type NotificationCategory =
  | 'session_starting'
  | 'dont_miss'
  | 'people_to_meet'
  | 'partner_spotlight'
  | 'auction'
  | 'admin_announcement';

export type Event = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  venue: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  geofence_radius_m: number | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Attendee = {
  id: string;
  event_id: string;
  user_id: string | null;
  ac_contact_id: string | null;
  email: string;
  name: string;
  company: string | null;
  role: string | null;
  photo_url: string | null;
  bio: string | null;
  interests: string[];
  visibility: AttendeeVisibility;
  dietary: string | null;
  qr_token: string;
  push_token: string | null;
  notification_prefs: Record<NotificationCategory, boolean> & Record<string, boolean>;
  checked_in_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Speaker = {
  id: string;
  event_id: string;
  name: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  headshot_url: string | null;
  linkedin_url: string | null;
  tags: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SpeakerFollower = {
  speaker_id: string;
  attendee_id: string;
  created_at: string;
};

export type Session = {
  id: string;
  event_id: string;
  title: string;
  abstract: string | null;
  start_at: string;
  end_at: string;
  room: string | null;
  type: SessionType;
  tags: string[];
  capacity: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type SessionSpeaker = { session_id: string; speaker_id: string };
export type SchedulePick = { attendee_id: string; session_id: string; created_at: string };

export type Partner = {
  id: string;
  event_id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  solutions_content: string | null;
  tags: string[];
  contact_email: string | null;
  website_url: string | null;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type PartnerInterest = {
  id: string;
  attendee_id: string;
  partner_id: string;
  ac_event_emitted_at: string | null;
  created_at: string;
};

export type Connection = {
  id: string;
  event_id: string;
  attendee_a: string;
  attendee_b: string;
  source: ConnectionSource;
  note: string | null;
  created_at: string;
};

export type PendingConnection = {
  id: string;
  event_id: string;
  initiator_id: string;
  captured_name: string | null;
  captured_email: string | null;
  captured_company: string | null;
  captured_phone: string | null;
  card_image_url: string | null;
  resolved_attendee_id: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  attendee_id: string;
  session_id: string | null;
  body: string;
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
  follow_up_questions: string[];
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  event_id: string;
  session_id: string | null;
  speaker_id: string | null;
  attendee_id: string;
  body: string;
  anonymous: boolean;
  status: QuestionStatus;
  upvotes: number;
  answered_at: string | null;
  moderation_note: string | null;
  created_at: string;
};

export type QuestionUpvote = { question_id: string; attendee_id: string; created_at: string };

export type AuctionItem = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  starting_bid: number;
  current_bid: number | null;
  current_bidder_id: string | null;
  ends_at: string;
  is_open: boolean;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Bid = {
  id: string;
  item_id: string;
  attendee_id: string;
  amount: number;
  created_at: string;
};

export type AppNotification = {
  id: string;
  event_id: string;
  type: NotificationCategory;
  title: string;
  body: string;
  data: Record<string, unknown>;
  target_segment: Record<string, unknown>;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_by: string | null;
  created_at: string;
};

export type NotificationRecipient = {
  notification_id: string;
  attendee_id: string;
  delivered_at: string | null;
  opened_at: string | null;
};

export type GalleryItem = {
  id: string;
  event_id: string;
  url: string;
  caption: string | null;
  taken_by: string | null;
  taken_at: string | null;
  is_official: boolean;
  created_at: string;
};

export type Faq = {
  id: string;
  event_id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
};

export type PodcastEpisode = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  audio_url: string;
  episode_url: string | null;
  duration_seconds: number | null;
  published_at: string;
};

export type DailySuggestion = {
  id: string;
  attendee_id: string;
  for_date: string;
  suggested_attendee_ids: string[];
  suggested_partner_ids: string[];
  rationale: Record<string, string>;
  created_at: string;
};

export type AdminUser = {
  id: string;
  user_id: string | null;
  email: string;
  role: 'owner' | 'editor' | 'moderator' | 'viewer';
  event_ids: string[];
  created_at: string;
};

export type AuditLog = {
  id: string;
  admin_user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};
