import ReCAPTCHA from 'react-google-recaptcha';

// Clave de prueba publica de Google (siempre pasa en demo); en prod definir VITE_RECAPTCHA_SITE_KEY
const SITE_KEY =
  (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined) ||
  '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

interface RecaptchaBoxProps {
  onChange: (token: string | null) => void;
}

/** Checkbox visible de reCAPTCHA v2 ("No soy un robot"). */
const RecaptchaBox = ({ onChange }: RecaptchaBoxProps) => (
  <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px' }}>
    <ReCAPTCHA
      sitekey={SITE_KEY}
      onChange={(token) => onChange(token)}
      onExpired={() => onChange(null)}
      onErrored={() => onChange(null)}
      hl="es"
    />
  </div>
);

export default RecaptchaBox;
