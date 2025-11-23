-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to send email via Resend API
CREATE OR REPLACE FUNCTION public.send_invoice_email(
  p_to TEXT,
  p_subject TEXT,
  p_html TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id bigint;
  v_resend_api_key TEXT := 're_SkQ2GKKA_2hmXXgjFHRSg3KPSqiYbX5os';
BEGIN
  -- Make HTTP POST request to Resend API
  SELECT net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'ProHavenLogs <noreply@prohavenlogs.com>',
      'to', ARRAY[p_to],
      'subject', p_subject,
      'html', p_html
    )
  ) INTO v_request_id;

  RETURN json_build_object(
    'success', true,
    'request_id', v_request_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.send_invoice_email(TEXT, TEXT, TEXT) TO authenticated;
