UPDATE public.daily_logs
SET sleep_hours = 5.2,
    sleep_quality = 'poor',
    stress_level = 'low',
    activity_minutes = 30,
    hydration_oz = 70,
    supplement_taken = true
WHERE user_id = '52543984-4f3a-4c11-8f6b-bf59011e368a'
  AND log_date >= CURRENT_DATE - INTERVAL '14 days';