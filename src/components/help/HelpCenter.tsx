import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Calendar, 
  Users, 
  DollarSign, 
  Settings,
  ChevronRight,
  FileText,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

// ============================================================================
// TYPES
// ============================================================================

interface HelpArticle {
  id: string;
  titleKey: string;
  contentKey: string;
  tagsKey: string;
}

interface HelpCategory {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  articles: HelpArticle[];
}

// ============================================================================
// HELP CONTENT DATA (Using translation keys)
// ============================================================================

const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'agenda',
    titleKey: 'help.categories.agenda.title',
    descriptionKey: 'help.categories.agenda.description',
    icon: Calendar,
    articles: [
      {
        id: 'crear-turno',
        titleKey: 'help.categories.agenda.articles.createSession.title',
        contentKey: 'help.categories.agenda.articles.createSession.content',
        tagsKey: 'help.categories.agenda.articles.createSession.tags',
      },
      {
        id: 'editar-turno',
        titleKey: 'help.categories.agenda.articles.editSession.title',
        contentKey: 'help.categories.agenda.articles.editSession.content',
        tagsKey: 'help.categories.agenda.articles.editSession.tags',
      },
      {
        id: 'google-calendar',
        titleKey: 'help.categories.agenda.articles.googleCalendar.title',
        contentKey: 'help.categories.agenda.articles.googleCalendar.content',
        tagsKey: 'help.categories.agenda.articles.googleCalendar.tags',
      },
    ],
  },
  {
    id: 'pacientes',
    titleKey: 'help.categories.pacientes.title',
    descriptionKey: 'help.categories.pacientes.description',
    icon: Users,
    articles: [
      {
        id: 'crear-paciente',
        titleKey: 'help.categories.pacientes.articles.createPatient.title',
        contentKey: 'help.categories.pacientes.articles.createPatient.content',
        tagsKey: 'help.categories.pacientes.articles.createPatient.tags',
      },
      {
        id: 'ficha-clinica',
        titleKey: 'help.categories.pacientes.articles.clinicalFile.title',
        contentKey: 'help.categories.pacientes.articles.clinicalFile.content',
        tagsKey: 'help.categories.pacientes.articles.clinicalFile.tags',
      },
      {
        id: 'buscar-pacientes',
        titleKey: 'help.categories.pacientes.articles.searchPatients.title',
        contentKey: 'help.categories.pacientes.articles.searchPatients.content',
        tagsKey: 'help.categories.pacientes.articles.searchPatients.tags',
      },
    ],
  },
  {
    id: 'cobros',
    titleKey: 'help.categories.cobros.title',
    descriptionKey: 'help.categories.cobros.description',
    icon: DollarSign,
    articles: [
      {
        id: 'registrar-pago',
        titleKey: 'help.categories.cobros.articles.registerPayment.title',
        contentKey: 'help.categories.cobros.articles.registerPayment.content',
        tagsKey: 'help.categories.cobros.articles.registerPayment.tags',
      },
      {
        id: 'historial-pagos',
        titleKey: 'help.categories.cobros.articles.paymentHistory.title',
        contentKey: 'help.categories.cobros.articles.paymentHistory.content',
        tagsKey: 'help.categories.cobros.articles.paymentHistory.tags',
      },
      {
        id: 'enviar-recordatorio',
        titleKey: 'help.categories.cobros.articles.sendReminder.title',
        contentKey: 'help.categories.cobros.articles.sendReminder.content',
        tagsKey: 'help.categories.cobros.articles.sendReminder.tags',
      },
    ],
  },
  {
    id: 'configuracion',
    titleKey: 'help.categories.configuracion.title',
    descriptionKey: 'help.categories.configuracion.description',
    icon: Settings,
    articles: [
      {
        id: 'perfil',
        titleKey: 'help.categories.configuracion.articles.profile.title',
        contentKey: 'help.categories.configuracion.articles.profile.content',
        tagsKey: 'help.categories.configuracion.articles.profile.tags',
      },
      {
        id: 'calendario-config',
        titleKey: 'help.categories.configuracion.articles.calendarConfig.title',
        contentKey: 'help.categories.configuracion.articles.calendarConfig.content',
        tagsKey: 'help.categories.configuracion.articles.calendarConfig.tags',
      },
    ],
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

interface CategoryCardProps {
  category: HelpCategory;
  onClick: () => void;
}

const CategoryCard = ({ category, onClick }: CategoryCardProps) => {
  const { t } = useTranslation();
  const Icon = category.icon;
  const articleCount = category.articles.length;
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
            {t(category.titleKey)}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {t(category.descriptionKey)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {articleCount} {t(articleCount !== 1 ? 'help.articles' : 'help.article')}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
      </div>
    </button>
  );
};

interface ArticleListProps {
  category: HelpCategory;
  onBack: () => void;
  onSelectArticle: (article: HelpArticle) => void;
}

const ArticleList = ({ category, onBack, onSelectArticle }: ArticleListProps) => {
  const { t } = useTranslation();
  const Icon = category.icon;
  
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('help.backToCategories')}
      </button>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{t(category.titleKey)}</h2>
      </div>
      
      <div className="space-y-2">
        {category.articles.map((article) => (
          <button
            key={article.id}
            onClick={() => onSelectArticle(article)}
            className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group flex items-center gap-3"
          >
            <FileText className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
            <span className="text-gray-700 group-hover:text-indigo-600 transition-colors">
              {t(article.titleKey)}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors ml-auto flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

interface ArticleViewProps {
  article: HelpArticle;
  categoryTitleKey: string;
  onBack: () => void;
}

const ArticleView = ({ article, categoryTitleKey, onBack }: ArticleViewProps) => {
  const { t } = useTranslation();
  const content = t(article.contentKey);
  const tags = t(article.tagsKey, { returnObjects: true }) as string[];
  
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('help.backTo', { category: t(categoryTitleKey) })}
      </button>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t(article.titleKey)}</h2>
        <div className="prose prose-sm prose-gray max-w-none">
          {content.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} className="font-semibold text-gray-900 mt-4">{line.replace(/\*\*/g, '')}</p>;
            }
            if (line.startsWith('- ')) {
              return <li key={i} className="text-gray-700 ml-4">{line.substring(2)}</li>;
            }
            if (line.match(/^\d+\./)) {
              return <p key={i} className="text-gray-700 ml-4">{line}</p>;
            }
            if (line.trim() === '') {
              return <div key={i} className="h-2" />;
            }
            // Handle inline bold
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i} className="text-gray-700">
                {parts.map((part, j) => 
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j} className="font-semibold text-gray-900">{part.replace(/\*\*/g, '')}</strong>
                    : part
                )}
              </p>
            );
          })}
        </div>
        
        {Array.isArray(tags) && tags.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">{t('help.relatedTopics')}</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HelpCenter() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // Search across all articles
  const searchResults = searchTerm.trim() 
    ? HELP_CATEGORIES.flatMap((cat) =>
        cat.articles
          .filter((article) => {
            const search = searchTerm.toLowerCase();
            const title = t(article.titleKey).toLowerCase();
            const content = t(article.contentKey).toLowerCase();
            const tags = t(article.tagsKey, { returnObjects: true }) as string[];
            return (
              title.includes(search) ||
              content.includes(search) ||
              (Array.isArray(tags) && tags.some((tag) => tag.toLowerCase().includes(search)))
            );
          })
          .map((article) => ({ ...article, categoryTitleKey: cat.titleKey, category: cat }))
      )
    : [];

  const handleSelectSearchResult = (result: typeof searchResults[0]) => {
    setSelectedCategory(result.category);
    setSelectedArticle(result);
    setSearchTerm('');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedArticle(null);
  };

  const handleBackToArticles = () => {
    setSelectedArticle(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-7 h-7 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('help.title')}</h1>
        <p className="text-gray-500 mt-1">
          {t('help.subtitle')}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t('help.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
        
        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={`${result.category.id}-${result.id}`}
                onClick={() => handleSelectSearchResult(result)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <p className="font-medium text-gray-900 text-sm">{t(result.titleKey)}</p>
                <p className="text-xs text-gray-500">{t(result.categoryTitleKey)}</p>
              </button>
            ))}
          </div>
        )}
        
        {searchTerm && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4 text-center">
            <p className="text-gray-500 text-sm">{t('help.noResults', { search: searchTerm })}</p>
          </div>
        )}
      </div>

      {/* Content */}
      {selectedArticle && selectedCategory ? (
        <ArticleView
          article={selectedArticle}
          categoryTitleKey={selectedCategory.titleKey}
          onBack={handleBackToArticles}
        />
      ) : selectedCategory ? (
        <ArticleList
          category={selectedCategory}
          onBack={handleBackToCategories}
          onSelectArticle={setSelectedArticle}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HELP_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      )}

      {/* Contact support */}
      <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
        <p className="text-sm text-gray-600">
          {t('help.notFound')}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {t('help.contactUs')}{' '}
          <a href="mailto:soporte@lavenius.com" className="text-indigo-600 hover:underline">
            soporte@lavenius.com
          </a>
        </p>
      </div>
    </div>
  );
}
