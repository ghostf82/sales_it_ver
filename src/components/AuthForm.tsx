import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Apple, AtSign, Eye, EyeOff, ToggleLeft as Google, Lock, Phone, User } from 'lucide-react';
import clsx from 'clsx';

interface AuthFormProps {
  isRegistration: boolean;
  onToggleMode: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export function AuthForm({ isRegistration, onToggleMode }: AuthFormProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistration) {
      // Validation
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        setError(t('registration.errorRequired'));
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError(t('registration.errorPasswordMatch'));
        return;
      }

      if (formData.password.length < 6) {
        setError(t('registration.errorPasswordLength'));
        return;
      }

      // Here you would typically make an API call to create the account
      // For now, we'll simulate success and redirect to login
      console.log('Registration data:', formData);
      onToggleMode(); // Switch back to login form
    } else {
      // Login validation
      if (!formData.email || !formData.password) {
        setError(t('login.errorRequired'));
        return;
      }

      // Here you would typically make an API call to login
      console.log('Login data:', formData);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">
          {isRegistration ? t('registration.title') : t('login')}
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {isRegistration && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('registration.fullName')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                placeholder={t('registration.fullName')}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            {t('email')}
          </label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
              placeholder={t('email')}
            />
          </div>
        </div>

        {isRegistration && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('registration.phone')}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                placeholder={t('registration.phone')}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            {t('password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
              placeholder={t('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {isRegistration && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('registration.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                placeholder={t('registration.confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {!isRegistration && (
          <div className="flex items-center justify-end">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              {t('forgotPassword')}
            </a>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
        >
          {isRegistration ? t('registration.submit') : t('login')}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
              {t('or')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Apple className="w-5 h-5" />
            Apple
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Google className="w-5 h-5" />
            Google
          </button>
        </div>

        <p className="text-center text-sm">
          {isRegistration ? (
            <>
              {t('registration.haveAccount')}{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('registration.login')}
              </button>
            </>
          ) : (
            <>
              {t('createAccount')}{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('createAccount')}
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}