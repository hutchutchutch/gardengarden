-- Add verification columns to image_analysis table for finger-counting anti-cheat system
ALTER TABLE image_analysis
ADD COLUMN verification_status TEXT CHECK (verification_status IN ('verified', 'unverified', 'suspicious', 'pending')) DEFAULT 'pending',
ADD COLUMN expected_finger_count INTEGER CHECK (expected_finger_count >= 1 AND expected_finger_count <= 4),
ADD COLUMN detected_finger_count INTEGER CHECK (detected_finger_count >= 0 AND detected_finger_count <= 10),
ADD COLUMN verification_confidence FLOAT CHECK (verification_confidence >= 0 AND verification_confidence <= 1),
ADD COLUMN verification_notes TEXT,
ADD COLUMN has_visible_person BOOLEAN DEFAULT false;

-- Create index for filtering by verification status
CREATE INDEX idx_image_analysis_verification_status ON image_analysis(verification_status);

-- Add verification metadata to daily_submissions table
ALTER TABLE daily_submissions
ADD COLUMN requires_verification BOOLEAN DEFAULT true,
ADD COLUMN verification_attempted BOOLEAN DEFAULT false;

-- Create a function to check verification status
CREATE OR REPLACE FUNCTION check_image_verification(
  p_expected_count INTEGER,
  p_detected_count INTEGER,
  p_confidence FLOAT
) RETURNS TEXT AS $$
BEGIN
  -- If no expected count, mark as pending
  IF p_expected_count IS NULL THEN
    RETURN 'pending';
  END IF;
  
  -- If detected count matches expected with high confidence
  IF p_detected_count = p_expected_count AND p_confidence > 0.7 THEN
    RETURN 'verified';
  END IF;
  
  -- If no fingers detected when expected
  IF p_expected_count > 0 AND (p_detected_count IS NULL OR p_detected_count = 0) THEN
    RETURN 'unverified';
  END IF;
  
  -- If significant mismatch or low confidence
  IF ABS(p_detected_count - p_expected_count) > 1 OR p_confidence < 0.5 THEN
    RETURN 'suspicious';
  END IF;
  
  -- Default to unverified for close mismatches
  RETURN 'unverified';
END;
$$ LANGUAGE plpgsql;

-- Update existing records to have pending verification status
UPDATE image_analysis 
SET verification_status = 'pending' 
WHERE verification_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN image_analysis.verification_status IS 'Status of finger-counting verification: verified (correct count), unverified (incorrect count), suspicious (tampering detected), pending (not yet verified)';
COMMENT ON COLUMN image_analysis.expected_finger_count IS 'Number of fingers the student was asked to show (1-4)';
COMMENT ON COLUMN image_analysis.detected_finger_count IS 'Number of fingers detected by AI vision analysis';
COMMENT ON COLUMN image_analysis.verification_confidence IS 'AI confidence score for finger detection (0-1)';
COMMENT ON COLUMN image_analysis.has_visible_person IS 'Whether a person/hands are visible in the image';