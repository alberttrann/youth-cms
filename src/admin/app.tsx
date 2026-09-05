/**
 * Admin entry - registers "multi-enum" and "single-enum" custom fields
 * and custom FAQ order extensions.
 */
import type { StrapiApp } from '@strapi/strapi/admin';
import { Button } from '@strapi/design-system';
import { Drag } from '@strapi/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { MultiEnumIcon } from './extensions/icons/MultiEnumIcon';
import { SingleEnumIcon } from './extensions/icons/SingleEnumIcon';

function FaqReorderAction() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  if (slug !== 'api::faq.faq') {
    return null;
  }

  return (
    <Button
      variant="secondary"
      startIcon={<Drag />}
      onClick={() => navigate('/faq-order')}
    >
      Reorder FAQs
    </Button>
  );
}

const brand = {
  100: '#D2E5F4',
  200: '#A5CBE9',
  500: '#1771B9',
  600: '#125A94',
  700: '#0E466F',
  900: '#072438',
};

export default {
  config: {
    locales: [],
    tutorials: false,
    notifications: { releases: false },
    theme: {
      light: {
        colors: {
          primary100: brand[100],
          primary200: brand[200],
          primary500: brand[500],
          primary600: brand[600],
          primary700: brand[700],
          buttonPrimary500: brand[500],
          buttonPrimary600: brand[600],
        },
      },
      dark: {
        colors: {
          primary100: brand[900],
          primary200: brand[700],
          primary500: brand[500],
          primary600: '#3B8FD4',
          primary700: brand[200],
          buttonPrimary500: brand[500],
          buttonPrimary600: '#3B8FD4',
        },
      },
    },
  },
  register(app: StrapiApp) {
    // 1. Register Multi-Enum Custom Field (Checklist)
    app.customFields.register({
      name: 'multi-enum',
      type: 'json',
      intlLabel: {
        id: 'global.multi-enum.label',
        defaultMessage: 'Multi-Select (checklist)',
      },
      intlDescription: {
        id: 'global.multi-enum.description',
        defaultMessage: 'Pick any number of values from a fixed list.',
      },
      icon: MultiEnumIcon,
      components: {
        Input: async () => {
          const mod = await import('./extensions/fields/MultiEnumInput');
          return { default: mod.MultiEnumInput };
        },
      },
      options: {
        base: [
          {
            sectionTitle: {
              id: 'global.multi-enum.options',
              defaultMessage: 'Choices',
            },
            items: [
              {
                name: 'options.choices' as any,
                intlLabel: {
                  id: 'global.multi-enum.choices.label',
                  defaultMessage:
                    'Choices (comma-separated, use = for label, e.g. 1=No Poverty,5=Gender Equality)',
                },
                description: {
                  id: 'global.multi-enum.choices.description',
                  defaultMessage: 'One entry per value; use = to set a display label.',
                } as any,
                type: 'text' as any,
                defaultValue: '',
              } as any,
            ],
          },
        ],
        advanced: [],
        validator: () => ({}),
      },
    });

    // 2. Register Single-Enum Custom Field (Dropdown)
    app.customFields.register({
      name: 'single-enum',
      type: 'string',
      intlLabel: {
        id: 'global.single-enum.label',
        defaultMessage: 'Single-Select (Dropdown)',
      },
      intlDescription: {
        id: 'global.single-enum.description',
        defaultMessage: 'Pick a single value from a custom list without enum normalization.',
      },
      icon: SingleEnumIcon,
      components: {
        Input: async () => {
          const mod = await import('./extensions/fields/SingleEnumInput');
          return { default: mod.SingleEnumInput };
        },
      },
      options: {
        base: [
          {
            sectionTitle: {
              id: 'global.single-enum.options',
              defaultMessage: 'Choices',
            },
            items: [
              {
                name: 'options.choices' as any,
                intlLabel: {
                  id: 'global.single-enum.choices.label',
                  defaultMessage: 'Choices (comma-separated, e.g. Southeast Asia,East Asia)',
                },
                description: {
                  id: 'global.single-enum.choices.description',
                  defaultMessage: 'One entry per value; use = to set a custom display label.',
                } as any,
                type: 'text' as any,
                defaultValue: '',
              } as any,
            ],
          },
        ],
        advanced: [],
        validator: () => ({}),
      },
    });

    // 3. Register FAQ Ordering Menu Item
    app.addMenuLink({
      to: '/faq-order',
      intlLabel: {
        id: 'global.faq-order.label',
        defaultMessage: 'FAQ Display Order',
      },
      Component: () => import('./extensions/pages/FaqOrderPage'),
      position: 9,
    });

    const cmPlugin = app.getPlugin('content-manager');
    if (cmPlugin) {
      cmPlugin.injectComponent('listView', 'actions', {
        name: 'faq-reorder-action',
        Component: FaqReorderAction,
      });
    }
  },
  bootstrap(_app: StrapiApp) {},
};