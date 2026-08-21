import { Progress, Typography } from 'antd';

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123', 'password1234',
  'contraseña', 'contraseña1', 'contraseña12', 'contraseña123',
  '123456', '12345678', '123456789', '1234567890',
  'qwerty', 'qwerty123', 'qwerty1234',
  'abc123', 'abcdef', 'abcdefg',
  'admin', 'admin123', 'admin1234', 'administrator',
  'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'login', 'changeme', 'shadow',
  'samsung', 'sunshine', 'princess', 'football',
  'baseball', 'soccer', 'hockey', 'batman',
  'access', 'hello', 'charlie', 'donald',
  'passw0rd', 'p@ssw0rd', 'p@ssword', 'p@ssword1',
  'iloveyou', 'trustno1', 'summer', 'winter',
  'spring', 'autumn', 'michael', 'jennifer',
  'thomas', 'jordan', 'superman', 'harley',
  'ranger', 'buster', 'thunder', 'ginger',
  'hammer', 'silver', 'phoenix', 'camaro',
  'secret', 'internet', 'computer', 'whatever',
  'ninja', 'mustang', 'jesus', 'pepper',
  'zxcvbn', 'zaq1zaq1', 'asd123', 'qwe123',
  'loveyou', 'babygirl', 'maggie', 'joshua',
  'andrea', 'nicole', 'daniel', 'jessica',
  'madison', 'ashley', 'samantha', 'brittany',
  'regula2026', 'regula123', 'santaclara',
  'financiera', 'antifraude'
]);

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  issues: string[];
}

export function evaluatePassword(password: string, userEmail?: string, userName?: string): StrengthResult {
  const issues: string[] = [];
  let score = 0;

  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 10;
  else issues.push('Minimo 12 caracteres');

  if (/[A-Z]/.test(password)) score += 20;
  else issues.push('Falta una mayuscula');

  if (/[a-z]/.test(password)) score += 15;
  else issues.push('Falta una minuscula');

  if (/\d/.test(password)) score += 15;
  else issues.push('Falta un numero');

  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 20;
  else issues.push('Falta un caracter especial');

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || [...COMMON_PASSWORDS].some((p) => lower.includes(p))) {
    score = Math.min(score, 20);
    issues.push('Contrasena muy comun');
  }

  if (userEmail && lower.includes(userEmail.toLowerCase().split('@')[0])) {
    score = Math.min(score, 30);
    issues.push('No debe contener tu correo');
  }
  if (userName && lower.includes(userName.toLowerCase())) {
    score = Math.min(score, 30);
    issues.push('No debe contener tu nombre');
  }

  if (password.length > 128) {
    score = 0;
    issues.push('Maximo 128 caracteres');
  }

  score = Math.min(100, Math.max(0, score));

  let label: string;
  let color: string;
  if (score < 30) { label = 'Debil'; color = '#ff4d4f'; }
  else if (score < 60) { label = 'Regular'; color = '#faad14'; }
  else if (score < 80) { label = 'Buena'; color = '#1890ff'; }
  else { label = 'Excelente'; color = '#52c41a'; }

  return { score, label, color, issues };
}

export const PasswordStrength = ({ password, userEmail, userName }: { password: string; userEmail?: string; userName?: string }) => {
  if (!password) return null;

  const result = evaluatePassword(password, userEmail, userName);

  return (
    <div style={{ marginTop: 4 }}>
      <Progress
        percent={result.score}
        strokeColor={result.color}
        size="small"
        showInfo={false}
        format={() => result.label}
      />
      {result.issues.length > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {result.issues.join(' · ')}
        </Typography.Text>
      )}
    </div>
  );
};
