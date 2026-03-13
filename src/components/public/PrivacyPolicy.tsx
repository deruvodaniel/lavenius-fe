import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, ArrowLeft, ExternalLink } from 'lucide-react';

export function PrivacyPolicy() {
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
            {t('privacyPolicy.backToHome')}
          </Link>
        </div>

        <article className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-10">
          <header className="mb-8 pb-6 border-b border-border">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-medium mb-4">
              <Shield className="w-4 h-4" />
              {t('privacyPolicy.badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {t('privacyPolicy.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.lastUpdated')}
            </p>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {t('privacyPolicy.intro')}
            </p>
          </header>

          <div className="space-y-8 text-sm sm:text-base">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.whoWeAre.title')}</h2>
              <p className="text-muted-foreground mb-3 leading-relaxed">{t('privacyPolicy.sections.whoWeAre.description')}</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">{t('privacyPolicy.sections.whoWeAre.controllerLabel')}:</strong> {t('privacyPolicy.sections.whoWeAre.controllerValue')}</li>
                <li><strong className="text-foreground">{t('privacyPolicy.sections.whoWeAre.emailLabel')}:</strong> {t('privacyPolicy.sections.whoWeAre.emailValue')}</li>
                <li><strong className="text-foreground">{t('privacyPolicy.sections.whoWeAre.addressLabel')}:</strong> {t('privacyPolicy.sections.whoWeAre.addressValue')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.dataCollected.title')}</h2>

              <h3 className="font-semibold text-foreground mb-2">{t('privacyPolicy.sections.dataCollected.therapists.title')}</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
                <li>{t('privacyPolicy.sections.dataCollected.therapists.items.0')}</li>
                <li>{t('privacyPolicy.sections.dataCollected.therapists.items.1')}</li>
                <li>{t('privacyPolicy.sections.dataCollected.therapists.items.2')}</li>
                <li>{t('privacyPolicy.sections.dataCollected.therapists.items.3')}</li>
              </ul>

              <h3 className="font-semibold text-foreground mb-2">{t('privacyPolicy.sections.dataCollected.patients.title')}</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
                <li>{t('privacyPolicy.sections.dataCollected.patients.items.0')}</li>
                <li>{t('privacyPolicy.sections.dataCollected.patients.items.1')}</li>
              </ul>

              <h3 className="font-semibold text-foreground mb-2">{t('privacyPolicy.sections.dataCollected.security.title')}</h3>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('privacyPolicy.sections.dataCollected.security.items.0')}</li>
                <li>{t('privacyPolicy.sections.dataCollected.security.items.1')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.usage.title')}</h2>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
                <li>{t('privacyPolicy.sections.usage.items.0')}</li>
                <li>{t('privacyPolicy.sections.usage.items.1')}</li>
                <li>{t('privacyPolicy.sections.usage.items.2')}</li>
                <li>{t('privacyPolicy.sections.usage.items.3')}</li>
                <li>{t('privacyPolicy.sections.usage.items.4')}</li>
              </ul>
              <p className="font-medium text-foreground">{t('privacyPolicy.sections.usage.noSale')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.googleOAuth.title')}</h2>
              <p className="text-muted-foreground mb-3 leading-relaxed">{t('privacyPolicy.sections.googleOAuth.description')}</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
                <li>{t('privacyPolicy.sections.googleOAuth.items.0')}</li>
                <li>{t('privacyPolicy.sections.googleOAuth.items.1')}</li>
                <li>{t('privacyPolicy.sections.googleOAuth.items.2')}</li>
                <li>{t('privacyPolicy.sections.googleOAuth.items.3')}</li>
              </ul>
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('privacyPolicy.sections.googleOAuth.policyLink')}
                <ExternalLink className="w-4 h-4" />
              </a>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.processors.title')}</h2>
              <p className="text-muted-foreground mb-3 leading-relaxed">{t('privacyPolicy.sections.processors.description')}</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('privacyPolicy.sections.processors.items.0')}</li>
                <li>{t('privacyPolicy.sections.processors.items.1')}</li>
                <li>{t('privacyPolicy.sections.processors.items.2')}</li>
                <li>{t('privacyPolicy.sections.processors.items.3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.security.title')}</h2>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('privacyPolicy.sections.security.items.0')}</li>
                <li>{t('privacyPolicy.sections.security.items.1')}</li>
                <li>{t('privacyPolicy.sections.security.items.2')}</li>
                <li>{t('privacyPolicy.sections.security.items.3')}</li>
                <li>{t('privacyPolicy.sections.security.items.4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.retention.title')}</h2>

              <h3 className="font-semibold text-foreground mb-2">{t('privacyPolicy.sections.retention.general.title')}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">{t('privacyPolicy.sections.retention.general.description')}</p>

              <h3 className="font-semibold text-foreground mb-2">{t('privacyPolicy.sections.retention.deletion.title')}</h3>
              <ol className="list-decimal pl-6 space-y-1 text-muted-foreground mb-4">
                <li>{t('privacyPolicy.sections.retention.deletion.items.0')}</li>
                <li>{t('privacyPolicy.sections.retention.deletion.items.1')}</li>
                <li>{t('privacyPolicy.sections.retention.deletion.items.2')}</li>
                <li>{t('privacyPolicy.sections.retention.deletion.items.3')}</li>
              </ol>

              <h3 className="font-semibold text-foreground mb-2">{t('privacyPolicy.sections.retention.audit.title')}</h3>
              <p className="text-muted-foreground leading-relaxed">{t('privacyPolicy.sections.retention.audit.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.rights.title')}</h2>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-3">
                <li>{t('privacyPolicy.sections.rights.items.0')}</li>
                <li>{t('privacyPolicy.sections.rights.items.1')}</li>
                <li>{t('privacyPolicy.sections.rights.items.2')}</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">{t('privacyPolicy.sections.rights.contact')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.transfers.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('privacyPolicy.sections.transfers.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.minors.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('privacyPolicy.sections.minors.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.changes.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('privacyPolicy.sections.changes.description')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('privacyPolicy.sections.contact.title')}</h2>
              <ul className="space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">{t('privacyPolicy.sections.contact.emailLabel')}:</strong> {t('privacyPolicy.sections.contact.emailValue')}</li>
                <li><strong className="text-foreground">{t('privacyPolicy.sections.contact.controllerLabel')}:</strong> {t('privacyPolicy.sections.contact.controllerValue')}</li>
              </ul>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
