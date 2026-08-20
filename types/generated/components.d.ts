import type { Schema, Struct } from '@strapi/strapi';

export interface SectionsCtaBanner extends Struct.ComponentSchema {
  collectionName: 'components_sections_cta_banners';
  info: {
    description: 'Full-width call to action banner';
    displayName: 'CTA Banner';
    icon: 'bullhorn';
  };
  attributes: {
    ctaLabel: Schema.Attribute.String & Schema.Attribute.Required;
    ctaUrl: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    hideStar: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    theme: Schema.Attribute.Enumeration<
      ['rainbow-gradient', 'blue-gradient', 'solid-brand', 'white-box']
    > &
      Schema.Attribute.DefaultTo<'rainbow-gradient'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsEmbed extends Struct.ComponentSchema {
  collectionName: 'components_sections_embeds';
  info: {
    description: 'Embed iframe, Google Maps, or video player';
    displayName: 'Embed (Video / Map / Custom)';
    icon: 'code';
  };
  attributes: {
    aspectRatio: Schema.Attribute.Enumeration<['16:9', '4:3', '1:1', 'auto']> &
      Schema.Attribute.DefaultTo<'16:9'>;
    caption: Schema.Attribute.String;
    embedUrl: Schema.Attribute.String & Schema.Attribute.Required;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsFaqSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_faq_sections';
  info: {
    description: 'Accordion FAQ section with global or custom questions';
    displayName: 'FAQ Section';
    icon: 'bulletList';
  };
  attributes: {
    customFaqs: Schema.Attribute.Component<'shared.faq-item', true>;
    description: Schema.Attribute.Text;
    showViewAllButton: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Frequently Asked Questions'>;
    useGlobalFaqs: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SectionsFeaturedMembers extends Struct.ComponentSchema {
  collectionName: 'components_sections_featured_members';
  info: {
    description: 'Embed selected member organizations or latest members';
    displayName: 'Featured Members';
    icon: 'earth';
  };
  attributes: {
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<6>;
    members: Schema.Attribute.Relation<'oneToMany', 'api::member.member'>;
    showViewAll: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Our Member Organizations'>;
  };
}

export interface SectionsFeaturedProjects extends Struct.ComponentSchema {
  collectionName: 'components_sections_featured_projects';
  info: {
    description: 'Embed selected projects or latest projects grid';
    displayName: 'Featured Projects';
    icon: 'archive';
  };
  attributes: {
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<3>;
    projects: Schema.Attribute.Relation<'oneToMany', 'api::project.project'>;
    showViewAll: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Featured Projects'>;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heroes';
  info: {
    description: 'Top header hero section with title, gradient highlights, media, and CTAs';
    displayName: 'Hero Section';
    icon: 'crown';
  };
  attributes: {
    buttons: Schema.Attribute.Component<'shared.button', true>;
    description: Schema.Attribute.Text;
    eyebrow: Schema.Attribute.String;
    highlightTitle: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    layoutVariant: Schema.Attribute.Enumeration<
      ['centered', 'split-media', 'video-modal']
    > &
      Schema.Attribute.DefaultTo<'centered'>;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    youtubeVideoId: Schema.Attribute.String;
  };
}

export interface SectionsImageGallery extends Struct.ComponentSchema {
  collectionName: 'components_sections_image_galleries';
  info: {
    description: 'Image gallery with grid or featured layout';
    displayName: 'Image Gallery';
    icon: 'picture';
  };
  attributes: {
    columns: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 2;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    images: Schema.Attribute.Media<'images', true> & Schema.Attribute.Required;
    maxVisible: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<7>;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    title: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<['grid', 'featured']> &
      Schema.Attribute.DefaultTo<'grid'>;
  };
}

export interface SectionsMediaText extends Struct.ComponentSchema {
  collectionName: 'components_sections_media_texts';
  info: {
    description: 'Side-by-side media and rich story content';
    displayName: 'Media & Text (2-Column)';
    icon: 'layout';
  };
  attributes: {
    button: Schema.Attribute.Component<'shared.button', false>;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    eyebrow: Schema.Attribute.String;
    media: Schema.Attribute.Media<'images' | 'videos'> &
      Schema.Attribute.Required;
    mediaPosition: Schema.Attribute.Enumeration<['left', 'right']> &
      Schema.Attribute.DefaultTo<'right'>;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsRichText extends Struct.ComponentSchema {
  collectionName: 'components_sections_rich_texts';
  info: {
    description: 'Strapi v5 native Blocks editor for rich formatted content';
    displayName: 'Rich Text Block';
    icon: 'feather';
  };
  attributes: {
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    title: Schema.Attribute.String;
  };
}

export interface SectionsStatsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_stats_grids';
  info: {
    description: 'Grid of animated counter statistics';
    displayName: 'Stats Grid';
    icon: 'chartBubble';
  };
  attributes: {
    animated: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    items: Schema.Attribute.Component<'shared.stat-item', true> &
      Schema.Attribute.Required;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    title: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<['home', 'about']> &
      Schema.Attribute.DefaultTo<'home'>;
  };
}

export interface SectionsTeamGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_team_grids';
  info: {
    description: 'Embed leadership team or committee members';
    displayName: 'Leadership & Team Grid';
    icon: 'user';
  };
  attributes: {
    leadershipType: Schema.Attribute.Enumeration<
      ['all', 'executive', 'continental-director']
    > &
      Schema.Attribute.DefaultTo<'all'>;
    style: Schema.Attribute.Component<'shared.section-style', false>;
    teamMembers: Schema.Attribute.Relation<
      'oneToMany',
      'api::team-member.team-member'
    >;
    termLabel: Schema.Attribute.String;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Leadership Team'>;
  };
}

export interface SharedButton extends Struct.ComponentSchema {
  collectionName: 'components_shared_buttons';
  info: {
    description: 'Call to action button or navigation link';
    displayName: 'Button';
    icon: 'cursor';
  };
  attributes: {
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    size: Schema.Attribute.Enumeration<['sm', 'md', 'lg']> &
      Schema.Attribute.DefaultTo<'md'>;
    target: Schema.Attribute.Enumeration<['_self', '_blank']> &
      Schema.Attribute.DefaultTo<'_self'>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    variant: Schema.Attribute.Enumeration<
      ['solid', 'outline', 'white', 'ghost', 'link']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'solid'>;
  };
}

export interface SharedFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_faq_items';
  info: {
    description: 'Question and answer pair';
    displayName: 'FaqItem';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSectionStyle extends Struct.ComponentSchema {
  collectionName: 'components_shared_section_styles';
  info: {
    description: 'Visual styling and layout options for a section';
    displayName: 'SectionStyle';
    icon: 'brush';
  };
  attributes: {
    background: Schema.Attribute.Enumeration<
      ['white', 'light-blue', 'dark-navy', 'rainbow-soft', 'transparent']
    > &
      Schema.Attribute.DefaultTo<'white'>;
    containerWidth: Schema.Attribute.Enumeration<
      ['narrow', 'default', 'wide', 'full']
    > &
      Schema.Attribute.DefaultTo<'default'>;
    paddingBottom: Schema.Attribute.Enumeration<
      ['none', 'compact', 'normal', 'spacious']
    > &
      Schema.Attribute.DefaultTo<'normal'>;
    paddingTop: Schema.Attribute.Enumeration<
      ['none', 'compact', 'normal', 'spacious']
    > &
      Schema.Attribute.DefaultTo<'normal'>;
    textAlign: Schema.Attribute.Enumeration<['left', 'center', 'right']> &
      Schema.Attribute.DefaultTo<'left'>;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Search Engine Optimization metadata';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    keywords: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaImage: Schema.Attribute.Media<'images'>;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    preventIndexing: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    displayName: 'SocialLink';
  };
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ['youtube', 'facebook', 'twitter', 'instagram', 'linkedin', 'tiktok']
    >;
    url: Schema.Attribute.String;
  };
}

export interface SharedStatItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_stat_items';
  info: {
    description: 'A metric item with numeric value and label';
    displayName: 'StatItem';
    icon: 'chartPie';
  };
  attributes: {
    description: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    prefix: Schema.Attribute.String & Schema.Attribute.DefaultTo<'+'>;
    suffix: Schema.Attribute.String;
    value: Schema.Attribute.Integer & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'sections.cta-banner': SectionsCtaBanner;
      'sections.embed': SectionsEmbed;
      'sections.faq-section': SectionsFaqSection;
      'sections.featured-members': SectionsFeaturedMembers;
      'sections.featured-projects': SectionsFeaturedProjects;
      'sections.hero': SectionsHero;
      'sections.image-gallery': SectionsImageGallery;
      'sections.media-text': SectionsMediaText;
      'sections.rich-text': SectionsRichText;
      'sections.stats-grid': SectionsStatsGrid;
      'sections.team-grid': SectionsTeamGrid;
      'shared.button': SharedButton;
      'shared.faq-item': SharedFaqItem;
      'shared.section-style': SharedSectionStyle;
      'shared.seo': SharedSeo;
      'shared.social-link': SharedSocialLink;
      'shared.stat-item': SharedStatItem;
    }
  }
}
