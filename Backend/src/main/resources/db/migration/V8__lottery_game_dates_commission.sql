ALTER TABLE public.lottery_games
 ADD COLUMN start_date date,
 ADD COLUMN end_date date,
 ADD COLUMN scheduled_commission_percent numeric(5,2),
 ADD COLUMN commission_effective_date date,
 ADD CONSTRAINT lottery_game_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date>=start_date),
 ADD CONSTRAINT lottery_scheduled_commission CHECK (scheduled_commission_percent BETWEEN 0 AND 100),
 ADD CONSTRAINT lottery_commission_schedule_pair CHECK ((scheduled_commission_percent IS NULL)=(commission_effective_date IS NULL));
