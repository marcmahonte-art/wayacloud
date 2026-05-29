-- Enable Realtime replication for storage tables
-- Required for the realtime-only architecture to work
ALTER PUBLICATION supabase_realtime ADD TABLE files;
ALTER PUBLICATION supabase_realtime ADD TABLE storage_quotas;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
