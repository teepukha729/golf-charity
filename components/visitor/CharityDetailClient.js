'use client';
// components/visitor/CharityDetailClient.js

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart, ExternalLink, ArrowLeft, Star, Calendar,
  Globe, Mail, Twitter, Facebook, Instagram, Linkedin, Users, TrendingUp
} from 'lucide-react';

function RichBlock({ block, index }) {
  switch (block.type) {
    case 'heading':
      return (
        <motion.h2
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
          className="font-display text-2xl font-bold text-white mt-10 mb-4"
        >
          {block.content}
        </motion.h2>
      );
    case 'paragraph':
      return (
        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
          className="text-[#7aad8a] leading-relaxed mb-5 text-base"
        >
          {block.content}
        </motion.p>
      );
    case 'image':
      return (
        <motion.figure
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }}
          className="my-8 rounded-2xl overflow-hidden border border-[#1f3527]"
        >
          <img src={block.url} alt={block.caption || ''} className="w-full object-cover max-h-[500px]" />
          {block.caption && (
            <figcaption className="text-xs text-[#5a8a6a] text-center py-3 px-4 bg-[#172219]">
              {block.caption}
            </figcaption>
          )}
        </motion.figure>
      );
    case 'quote':
      return (
        <motion.blockquote
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
          className="my-8 pl-6 border-l-4 border-[#4ade80]"
        >
          <p className="text-lg text-white italic leading-relaxed mb-2">"{block.content}"</p>
          {block.attribution && (
            <cite className="text-sm text-[#7aad8a] not-italic">— {block.attribution}</cite>
          )}
        </motion.blockquote>
      );
    default:
      return null;
  }
}

function SocialIcon({ platform }) {
  const icons = {
    twitter: Twitter, facebook: Facebook, instagram: Instagram, linkedin: Linkedin,
  };
  const Icon = icons[platform] || Globe;
  return <Icon className="w-4 h-4" />;
}

export default function CharityDetailClient({ charity, relatedCharities }) {
  const hasContent = charity.content?.length > 0;
  const hasGallery = charity.gallery_urls?.length > 0;
  const hasStats = charity.impact_stats?.length > 0;
  const hasSocial = Object.values(charity.social_links || {}).some(Boolean);

  return (
    <div className="pt-24 pb-16">
      {/* Back button */}
      <div className="max-w-5xl mx-auto px-6 mb-8">
        <Link href="/charities" className="inline-flex items-center gap-2 text-sm text-[#7aad8a] hover:text-[#4ade80] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          All Charities
        </Link>
      </div>

      {/* Hero Banner */}
      <section className="max-w-5xl mx-auto px-6 mb-10">
        <div className="relative rounded-2xl overflow-hidden h-64 md:h-80"
          style={{ background: 'linear-gradient(135deg, #1a2e23, #0f1f16)' }}>
          {charity.banner_url && (
            <img src={charity.banner_url} alt={charity.name}
              className="absolute inset-0 w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] via-transparent to-transparent" />

          {/* Logo */}
          {charity.logo_url && (
            <div className="absolute bottom-6 left-6 w-20 h-20 rounded-2xl border-2 border-[#2d5c3f] bg-white overflow-hidden shadow-xl">
              <img src={charity.logo_url} alt={`${charity.name} logo`} className="w-full h-full object-contain p-2" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-4 right-4 flex gap-2">
            {charity.is_featured && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full badge-gold text-xs font-medium">
                <Star className="w-3 h-3" /> Featured
              </span>
            )}
            {charity.category && (
              <span className="px-3 py-1.5 rounded-full bg-[#1a2e23]/80 border border-[#2d5c3f] text-[#7aad8a] text-xs backdrop-blur-sm">
                {charity.category}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main content grid */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Main content */}
          <div className="lg:col-span-2">
            <motion.h1
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl font-bold text-white mb-4"
            >
              {charity.name}
            </motion.h1>

            {charity.short_bio && (
              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="text-lg text-[#7aad8a] leading-relaxed mb-8 border-l-2 border-[#2d5c3f] pl-4"
              >
                {charity.short_bio}
              </motion.p>
            )}

            {/* Rich content blocks */}
            {hasContent && (
              <div className="mb-10">
                {charity.content.map((block, i) => (
                  <RichBlock key={i} block={block} index={i} />
                ))}
              </div>
            )}

            {/* Fallback plain description */}
            {!hasContent && charity.description && (
              <p className="text-[#7aad8a] leading-relaxed mb-8">{charity.description}</p>
            )}

            {/* Gallery */}
            {hasGallery && (
              <div className="mb-10">
                <h2 className="font-display text-xl font-bold text-white mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {charity.gallery_urls.map((url, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="aspect-square rounded-xl overflow-hidden border border-[#1f3527] cursor-pointer hover:border-[#4ade80] transition-colors"
                    >
                      <img src={url} alt={`${charity.name} gallery ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {charity.upcoming_events?.length > 0 && (
              <div className="mb-10">
                <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#4ade80]" /> Upcoming Events
                </h2>
                <div className="space-y-3">
                  {charity.upcoming_events.map((event, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#172219] border border-[#1f3527]">
                      <p className="text-sm text-[#7aad8a]">
                        {typeof event === 'string' ? event : event.name}
                      </p>
                      {typeof event === 'object' && event.date && (
                        <p className="text-xs text-[#5a8a6a] mt-1">{event.date}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-5">

            {/* CTA Card */}
            <motion.div
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="stat-card"
            >
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-[#f87171]" />
                <span className="text-sm font-medium text-white">Support This Charity</span>
              </div>
              {charity.total_raised > 0 && (
                <div className="mb-4">
                  <div className="text-2xl font-bold text-[#4ade80]">
                    £{parseFloat(charity.total_raised).toLocaleString()}
                  </div>
                  <div className="text-xs text-[#5a8a6a]">raised through the platform</div>
                </div>
              )}
              <Link href="/subscribe" className="btn-accent w-full justify-center text-sm py-3 block text-center">
                Choose This Charity
              </Link>
            </motion.div>

            {/* Impact Stats */}
            {hasStats && (
              <motion.div
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                className="stat-card"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#4ade80]" />
                  <span className="text-sm font-medium text-white">Impact</span>
                </div>
                <div className="space-y-3">
                  {charity.impact_stats.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-[#7aad8a]">{stat.label}</span>
                      <span className="text-sm font-bold text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="stat-card space-y-3"
            >
              {charity.founded_year && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5a8a6a]">Founded</span>
                  <span className="text-white">{charity.founded_year}</span>
                </div>
              )}
              {charity.registered_number && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5a8a6a]">Charity No.</span>
                  <span className="text-white font-mono text-xs">{charity.registered_number}</span>
                </div>
              )}
              {charity.website && (
                <a href={charity.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#7aad8a] hover:text-[#4ade80] transition-colors pt-1">
                  <Globe className="w-3.5 h-3.5" />
                  Official Website
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              )}
              {charity.contact_email && (
                <a href={`mailto:${charity.contact_email}`}
                  className="flex items-center gap-2 text-sm text-[#7aad8a] hover:text-[#4ade80] transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  {charity.contact_email}
                </a>
              )}
            </motion.div>

            {/* Social Links */}
            {hasSocial && (
              <motion.div
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                className="stat-card"
              >
                <div className="text-xs text-[#5a8a6a] mb-3 uppercase tracking-wider">Follow</div>
                <div className="flex gap-3">
                  {Object.entries(charity.social_links).map(([platform, url]) =>
                    url ? (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                        className="w-9 h-9 rounded-lg bg-[#172219] border border-[#1f3527] flex items-center justify-center text-[#7aad8a] hover:text-[#4ade80] hover:border-[#4ade80] transition-all">
                        <SocialIcon platform={platform} />
                      </a>
                    ) : null
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Charities */}
        {relatedCharities.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[#1f3527]">
            <h2 className="font-display text-2xl font-bold text-white mb-6">
              More {charity.category} Charities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedCharities.map((rel, i) => (
                <motion.div
                  key={rel.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                >
                  <Link href={`/charities/${rel.slug || rel.id}`}
                    className="stat-card card-hover flex flex-col h-full block hover:border-[#2d5c3f] transition-all">
                    <div className="h-24 rounded-xl mb-3 overflow-hidden relative"
                      style={{ background: 'linear-gradient(135deg, #1a2e23, #172219)' }}>
                      {rel.banner_url
                        ? <img src={rel.banner_url} alt={rel.name} className="w-full h-full object-cover opacity-60" />
                        : <div className="flex items-center justify-center h-full"><Heart className="w-8 h-8 text-[#2d5c3f]" /></div>}
                      {rel.logo_url && (
                        <div className="absolute bottom-2 left-2 w-9 h-9 rounded-lg border border-[#2d5c3f] bg-white overflow-hidden">
                          <img src={rel.logo_url} alt="" className="w-full h-full object-contain p-1" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1">{rel.name}</h3>
                    <p className="text-xs text-[#5a8a6a] line-clamp-2 flex-1">{rel.description}</p>
                    <div className="mt-3 text-xs text-[#4ade80] font-medium">Read more →</div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* CTA footer */}
      <section className="py-20 text-center px-6 mt-10">
        <h2 className="font-display text-3xl font-bold text-white mb-4">Make Every Round Count</h2>
        <p className="text-[#7aad8a] mb-8 max-w-lg mx-auto">
          Subscribe and choose a charity to support. A minimum of 10% of your subscription goes directly to your chosen cause.
        </p>
        <Link href="/subscribe" className="btn-accent text-base py-4 px-10">
          Choose Your Charity
        </Link>
      </section>
    </div>
  );
}
