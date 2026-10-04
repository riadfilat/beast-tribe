-- 067 Place and facility photos have no member uploader: the queue must accept them
-- (otherwise saving such a photo failed in the 066 trigger).
ALTER TABLE image_moderation_queue ALTER COLUMN uploaded_by DROP NOT NULL;
