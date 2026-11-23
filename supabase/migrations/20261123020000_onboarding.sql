-- Onboarding: één keer de rondleiding, daarna niet meer (opnieuw te bekijken via Instellingen).
alter table members add column onboarded_at timestamptz;
