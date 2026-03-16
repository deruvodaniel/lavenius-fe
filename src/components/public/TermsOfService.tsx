import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, ArrowLeft } from 'lucide-react';

export function TermsOfService() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-background dark:via-indigo-950/20 dark:to-purple-950/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('termsOfService.backToHome')}
          </Link>
        </div>

        <article className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-10">
          <header className="mb-8 pb-6 border-b border-border">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-medium mb-4">
              <FileText className="w-4 h-4" />
              {t('termsOfService.badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {t('termsOfService.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('termsOfService.lastUpdated')}</p>
            <p className="text-muted-foreground mt-4 leading-relaxed">{t('termsOfService.intro')}</p>
          </header>

          <div className="space-y-8 text-sm sm:text-base">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.acceptance.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('termsOfService.sections.acceptance.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.service.title')}</h2>
              <p className="text-muted-foreground mb-3 leading-relaxed">{t('termsOfService.sections.service.description')}</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('termsOfService.sections.service.items.0')}</li>
                <li>{t('termsOfService.sections.service.items.1')}</li>
                <li>{t('termsOfService.sections.service.items.2')}</li>
                <li>{t('termsOfService.sections.service.items.3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.eligibility.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('termsOfService.sections.eligibility.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.account.title')}</h2>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('termsOfService.sections.account.items.0')}</li>
                <li>{t('termsOfService.sections.account.items.1')}</li>
                <li>{t('termsOfService.sections.account.items.2')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.professionalUse.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('termsOfService.sections.professionalUse.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.prohibited.title')}</h2>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('termsOfService.sections.prohibited.items.0')}</li>
                <li>{t('termsOfService.sections.prohibited.items.1')}</li>
                <li>{t('termsOfService.sections.prohibited.items.2')}</li>
                <li>{t('termsOfService.sections.prohibited.items.3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.google.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('termsOfService.sections.google.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.billing.title')}</h2>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('termsOfService.sections.billing.items.0')}</li>
                <li>{t('termsOfService.sections.billing.items.1')}</li>
                <li>{t('termsOfService.sections.billing.items.2')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.availability.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('termsOfService.sections.availability.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.liability.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('termsOfService.sections.liability.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.termination.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('termsOfService.sections.termination.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.changes.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('termsOfService.sections.changes.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('termsOfService.sections.contact.title')}</h2>
              <ul className="space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">{t('termsOfService.sections.contact.emailLabel')}:</strong> {t('termsOfService.sections.contact.emailValue')}</li>
                <li><strong className="text-foreground">{t('termsOfService.sections.contact.ownerLabel')}:</strong> {t('termsOfService.sections.contact.ownerValue')}</li>
              </ul>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
