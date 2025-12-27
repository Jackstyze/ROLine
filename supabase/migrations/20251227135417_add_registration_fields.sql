-- Add new registration fields to profiles table
-- Student: matricule, bac_number
-- Merchant: commerce_register
-- All: date_of_birth

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS matricule VARCHAR(20),
ADD COLUMN IF NOT EXISTS bac_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS commerce_register VARCHAR(30);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth (must be 18+)';
COMMENT ON COLUMN public.profiles.matricule IS 'Student matricule number';
COMMENT ON COLUMN public.profiles.bac_number IS 'Student BAC number';
COMMENT ON COLUMN public.profiles.commerce_register IS 'Merchant commerce register number';

-- Update the trigger to handle new metadata fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    wilaya_id,
    date_of_birth,
    matricule,
    bac_number,
    commerce_register
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    (NEW.raw_user_meta_data->>'wilaya_id')::integer,
    (NEW.raw_user_meta_data->>'date_of_birth')::date,
    NEW.raw_user_meta_data->>'matricule',
    NEW.raw_user_meta_data->>'bac_number',
    NEW.raw_user_meta_data->>'commerce_register'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
