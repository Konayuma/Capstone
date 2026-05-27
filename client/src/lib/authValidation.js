const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const validateEmail = (email) => {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return 'Email is required.';
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return 'Enter a valid email address.';
  }

  return '';
};

const validatePassword = (password, { minLength = 1 } = {}) => {
  const value = String(password || '');

  if (!value.trim()) {
    return 'Password is required.';
  }

  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters.`;
  }

  return '';
};

export const validateLoginCredentials = ({ email, password }) => ({
  email: validateEmail(email),
  password: validatePassword(password),
});

export const validateRegistrationInput = ({ name, email, password }) => ({
  name: String(name || '').trim().length < 2 ? 'Name must be at least 2 characters.' : '',
  email: validateEmail(email),
  password: validatePassword(password, { minLength: 6 }),
});

export const normalizeAuthEmail = normalizeEmail;
