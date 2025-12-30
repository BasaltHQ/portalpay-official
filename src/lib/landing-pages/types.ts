/**
 * Landing Page Type Definitions
 * Core types for the programmatic SEO system
 */

export interface IndustryLandingData {
  // Basics
  slug: string;
  name: string;
  icon: string;

  // SEO
  title: string;
  metaDescription: string;
  keywords: string[];

  // Hero Section
  heroHeadline: string;
  heroSubheadline: string;
  heroCTA: {
    primary: string;
    primaryLink: string;
    secondary: string;
    secondaryLink: string;
  };

  // Value Props
  painPoints: string[];
  solutions: string[];

  // Benefits
  benefits: Array<{
    icon: string;
    title: string;
    description: string;
    stat?: string;
  }>;

  // Cost Comparison
  avgMonthlyVolume: number;
  competitorComparison: {
    [key: string]: {
      processingFee: number;
      flatFee: number;
      monthlyFee: number;
      annualSoftwareCost: number;
    };
  };

  // Use Cases
  useCases: Array<{
    title: string;
    description: string;
    example: string;
    savings?: string;
  }>;

  // Features
  industryFeatures: string[];
  includedFeatures: Array<{
    name: string;
    description: string;
    usualCost?: string;
  }>;

  // Setup Steps
  setupSteps: string[];

  // FAQ
  faqs: Array<{
    question: string;
    answer: string;
    category?: string;
  }>;

  // Social Proof
  testimonials?: Array<{
    quote: string;
    author: string;
    business: string;
    savings?: string;
  }>;

  // Related
  relatedIndustries: string[];
  relatedUseCases: string[];
}

export interface ComparisonData {
  slug: string;
  name: string;
  logo?: string;

  // SEO
  title: string;
  metaDescription: string;

  // Hero
  headline: string;
  subheadline: string;

  // Comparison
  pricing: {
    processingFee: number;
    flatFee: number;
    monthlyFee: number;
    annualSoftwareCost: number;
  };

  features: Array<{
    feature: string;
    basaltsurge: string | boolean;
    competitor: string | boolean;
    advantage?: boolean;
  }>;

  // Migration
  migrationSteps?: string[];

  // Use Cases
  useCases: Array<{
    scenario: string;
    competitorCost: number;
    basaltsurgeCost: number;
    savings: number;
  }>;
}

export interface UseCaseData {
  slug: string;
  name: string;

  // SEO
  title: string;
  metaDescription: string;

  // Hero
  headline: string;
  subheadline: string;

  // Content
  benefits: Array<{
    icon: string;
    title: string;
    description: string;
  }>;

  howItWorks: string[];

  useCases: Array<{
    title: string;
    description: string;
    example: string;
  }>;

  faqs: Array<{
    question: string;
    answer: string;
  }>;

  relatedIndustries: string[];
}

export interface LocationData {
  slug: string;
  name: string;
  city: string;
  state?: string;
  country: string;

  // SEO
  title: string;
  metaDescription: string;

  // Content
  localContext?: string;
  popularIndustries: string[];

  // Stats
  population?: number;
  businessCount?: number;
}

export interface TokenData {
  slug: string;
  name: string;
  symbol: string;

  // SEO
  title: string;
  metaDescription: string;

  // Content
  benefits: string[];
  useCases: string[];

  // Technical
  network: string;
  isStablecoin: boolean;
}
