import { useState } from 'react';
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
  title: string;
  content: string;
  tags: string[];
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  articles: HelpArticle[];
}

// ============================================================================
// HELP CONTENT DATA
// ============================================================================

const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'agenda',
    title: 'Agenda',
    description: 'Aprende a gestionar tus turnos y citas',
    icon: Calendar,
    articles: [
      {
        id: 'crear-turno',
        title: 'Crear un nuevo turno',
        content: `Para crear un nuevo turno:

1. Ve a la sección **Agenda** desde el menú lateral
2. Haz clic en el botón **"Nuevo Turno"**
3. Selecciona el paciente de la lista
4. Elige la fecha y hora del turno
5. Selecciona la modalidad (presencial o remoto)
6. Haz clic en **"Guardar"**

**Tip:** También puedes crear turnos haciendo clic directamente en el calendario.`,
        tags: ['turno', 'crear', 'agendar', 'cita'],
      },
      {
        id: 'editar-turno',
        title: 'Editar o cancelar un turno',
        content: `Para editar un turno existente:

1. Encuentra el turno en la lista o calendario
2. Haz clic en el ícono de **editar** (lápiz)
3. Modifica los datos necesarios
4. Guarda los cambios

Para cancelar un turno, cambia el estado a "Cancelado" desde el drawer de edición.`,
        tags: ['turno', 'editar', 'cancelar', 'modificar'],
      },
      {
        id: 'google-calendar',
        title: 'Conectar Google Calendar',
        content: `Para sincronizar con Google Calendar:

1. Ve a **Configuración** desde el menú lateral
2. En la sección "Calendario", haz clic en **"Conectar Google Calendar"**
3. Autoriza la aplicación en la ventana emergente
4. Una vez conectado, tus turnos se sincronizarán automáticamente

**Beneficios:**
- Recibe recordatorios en tu celular
- Tus pacientes reciben invitaciones de calendario
- Ve todos tus eventos en un solo lugar`,
        tags: ['google', 'calendar', 'calendario', 'sincronizar', 'conectar'],
      },
    ],
  },
  {
    id: 'pacientes',
    title: 'Pacientes',
    description: 'Gestión de pacientes y fichas clínicas',
    icon: Users,
    articles: [
      {
        id: 'crear-paciente',
        title: 'Registrar un nuevo paciente',
        content: `Para registrar un nuevo paciente:

1. Ve a la sección **Pacientes** desde el menú lateral
2. Haz clic en **"Nuevo Paciente"**
3. Completa los datos personales (nombre, email, teléfono)
4. Agrega información adicional (cobertura médica, frecuencia de sesiones)
5. Haz clic en **"Guardar"**

**Tip:** Puedes agregar notas iniciales en el campo de observaciones.`,
        tags: ['paciente', 'crear', 'registrar', 'nuevo'],
      },
      {
        id: 'ficha-clinica',
        title: 'Usar la ficha clínica',
        content: `La ficha clínica te permite:

- Ver el historial completo del paciente
- Registrar notas de cada sesión
- Consultar sesiones pasadas y futuras
- Ver el estado de pagos

Para acceder, haz clic en **"Ver ficha"** desde la tarjeta del paciente o desde un turno en la agenda.`,
        tags: ['ficha', 'clinica', 'historial', 'notas'],
      },
      {
        id: 'buscar-pacientes',
        title: 'Buscar y filtrar pacientes',
        content: `Puedes buscar pacientes de varias formas:

1. **Búsqueda por nombre:** Usa la barra de búsqueda
2. **Filtro por modalidad:** Presencial, remoto o mixto
3. **Filtro por frecuencia:** Semanal, quincenal o mensual
4. **Turnos esta semana:** Muestra solo pacientes con citas próximas

Los filtros se pueden combinar para resultados más específicos.`,
        tags: ['buscar', 'filtrar', 'pacientes', 'modalidad'],
      },
    ],
  },
  {
    id: 'cobros',
    title: 'Cobros',
    description: 'Control de pagos y facturación',
    icon: DollarSign,
    articles: [
      {
        id: 'registrar-pago',
        title: 'Registrar un pago',
        content: `Para registrar un pago:

1. Ve a la sección **Cobros** desde el menú lateral
2. Encuentra la sesión pendiente en la pestaña "Pendientes"
3. Haz clic en **"Cobrar"**
4. Confirma el monto y método de pago
5. Guarda el pago

**Tip:** También puedes registrar pagos directamente desde la ficha del paciente.`,
        tags: ['pago', 'cobrar', 'registrar', 'dinero'],
      },
      {
        id: 'historial-pagos',
        title: 'Ver historial de pagos',
        content: `El historial de pagos muestra:

- Todos los pagos realizados
- Fecha y monto de cada pago
- Paciente asociado
- Descripción del pago

Puedes filtrar por rango de fechas usando los filtros rápidos (semana, mes) o seleccionando fechas personalizadas.`,
        tags: ['historial', 'pagos', 'ver', 'filtrar'],
      },
      {
        id: 'enviar-recordatorio',
        title: 'Enviar recordatorio de pago',
        content: `Para enviar un recordatorio:

1. En la pestaña "Pendientes", encuentra la sesión
2. Haz clic en **"Recordatorio"**
3. Revisa el mensaje predefinido (puedes editarlo)
4. Elige enviar por WhatsApp o copiar el mensaje

El mensaje incluye automáticamente los datos de la sesión y el monto.`,
        tags: ['recordatorio', 'whatsapp', 'mensaje', 'cobrar'],
      },
    ],
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    description: 'Personaliza tu experiencia',
    icon: Settings,
    articles: [
      {
        id: 'perfil',
        title: 'Editar tu perfil',
        content: `Para editar tu perfil:

1. Haz clic en tu nombre en el menú lateral
2. O ve a la sección **Perfil**
3. Modifica tus datos personales
4. Guarda los cambios

Puedes actualizar: nombre, email y contraseña.`,
        tags: ['perfil', 'editar', 'datos', 'cuenta'],
      },
      {
        id: 'calendario-config',
        title: 'Configurar calendario',
        content: `En la sección de Configuración puedes:

- Conectar o desconectar Google Calendar
- Ver el estado de la sincronización
- Forzar una sincronización manual

La sincronización es bidireccional: los cambios en Lavenius aparecen en tu Google Calendar y viceversa.`,
        tags: ['calendario', 'configurar', 'google', 'sincronizar'],
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
  const Icon = category.icon;
  
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
            {category.title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {category.description}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {category.articles.length} artículo{category.articles.length !== 1 ? 's' : ''}
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
  const Icon = category.icon;
  
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a categorías
      </button>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
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
              {article.title}
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
  categoryTitle: string;
  onBack: () => void;
}

const ArticleView = ({ article, categoryTitle, onBack }: ArticleViewProps) => {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a {categoryTitle}
      </button>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{article.title}</h2>
        <div className="prose prose-sm prose-gray max-w-none">
          {article.content.split('\n').map((line, i) => {
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
        
        {article.tags.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Temas relacionados:</p>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // Search across all articles
  const searchResults = searchTerm.trim() 
    ? HELP_CATEGORIES.flatMap((cat) =>
        cat.articles
          .filter((article) => {
            const search = searchTerm.toLowerCase();
            return (
              article.title.toLowerCase().includes(search) ||
              article.content.toLowerCase().includes(search) ||
              article.tags.some((tag) => tag.toLowerCase().includes(search))
            );
          })
          .map((article) => ({ ...article, categoryTitle: cat.title, category: cat }))
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
        <h1 className="text-2xl font-bold text-gray-900">Centro de Ayuda</h1>
        <p className="text-gray-500 mt-1">
          Encuentra respuestas a tus preguntas sobre Lavenius
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar en la ayuda..."
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
                <p className="font-medium text-gray-900 text-sm">{result.title}</p>
                <p className="text-xs text-gray-500">{result.categoryTitle}</p>
              </button>
            ))}
          </div>
        )}
        
        {searchTerm && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4 text-center">
            <p className="text-gray-500 text-sm">No se encontraron resultados para "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Content */}
      {selectedArticle && selectedCategory ? (
        <ArticleView
          article={selectedArticle}
          categoryTitle={selectedCategory.title}
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
          ¿No encontraste lo que buscabas?
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Contáctanos en{' '}
          <a href="mailto:soporte@lavenius.com" className="text-indigo-600 hover:underline">
            soporte@lavenius.com
          </a>
        </p>
      </div>
    </div>
  );
}
