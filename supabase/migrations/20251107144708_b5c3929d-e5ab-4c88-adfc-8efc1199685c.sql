-- Update call_type enum to include call and meeting
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'call';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'meeting';