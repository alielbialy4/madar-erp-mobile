/** Auth copy via i18n — keys align with front/src/locales (auth.*). */
import i18n from '@/i18n';

export const authCopy = {
  get brandName() {
    return i18n.t('auth.brandName');
  },
  get heroTagline() {
    return i18n.t('auth.heroTagline');
  },
  get heroSecureNote() {
    return i18n.t('auth.heroSecureNote');
  },
  get loginHeading() {
    return i18n.t('auth.loginHeading');
  },
  get loginSubheading() {
    return i18n.t('auth.loginSubheading');
  },
  get tenantId() {
    return i18n.t('auth.tenantId');
  },
  get tenantIdPlaceholder() {
    return i18n.t('auth.tenantIdPlaceholder');
  },
  get tenantHint() {
    return i18n.t('auth.tenantHint');
  },
  get email() {
    return i18n.t('auth.email');
  },
  get emailPlaceholder() {
    return i18n.t('auth.emailPlaceholder');
  },
  get emailRequired() {
    return i18n.t('auth.emailRequired');
  },
  get emailInvalid() {
    return i18n.t('auth.emailInvalid');
  },
  get password() {
    return i18n.t('auth.password');
  },
  get passwordPlaceholder() {
    return i18n.t('auth.passwordPlaceholder');
  },
  get passwordRequired() {
    return i18n.t('auth.passwordRequired');
  },
  get passwordMinLength() {
    return i18n.t('auth.passwordMinLength');
  },
  get signIn() {
    return i18n.t('auth.signIn');
  },
  get loginSuccess() {
    return i18n.t('auth.loginSuccess');
  },
  get developedBy() {
    return i18n.t('auth.developedBy');
  },
  get developerName() {
    return i18n.t('auth.developerName');
  },
} as const;
