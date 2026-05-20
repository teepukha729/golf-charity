'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Heart, ExternalLink, Star } from 'lucide-react';

export default function CharitiesClient({ initialCharities, categories }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filtered = useMemo(() => {
    return initialCharities.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = !selectedCategory || c.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [initialCharities, search, selectedCategory]);

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(248,113,113,0.05),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto px-6">
          <span className="text-xs uppercase tracking-widest text-[#f87171] mb-4 block">Making a Difference</span>
          <h1 className="font-display text-5xl font-bold text-white mb-6">Our Charities</h1>
          <p className="text-lg text-[#7aad8a] leading-relaxed">
            A portion of every subscription goes directly to the charity you choose. Explore our partners and find the cause closest to your heart.
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7aad8a]" />
            <input
              type="text"
              placeholder="Search charities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-dark pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                !selectedCategory
                  ? 'bg-[#2d6a4f] border-[#4ade80] text-white'
                  : 'border-[#1f3527] text-[#7aad8a] hover:border-[#4ade80]'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#2d6a4f] border-[#4ade80] text-white'
                    : 'border-[#1f3527] text-[#7aad8a] hover:border-[#4ade80]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-[#7aad8a]">
          {filtered.length} {filtered.length === 1 ? 'charity' : 'charities'} found
        </div>
      </section>

      {/* Charity Grid */}
      <section className="max-w-7xl mx-auto px-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#7aad8a]">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No charities found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((charity, i) => (
              <motion.div
                key={charity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="stat-card card-hover flex flex-col"
              >
                {/* Banner/Logo area */}
                <div className="h-32 rounded-xl mb-4 overflow-hidden relative"
                  style={{ background: 'linear-gradient(135deg, #1a2e23, #172219)' }}>
                  {charity.banner_url ? (
                    <img src={charity.banner_url} alt={charity.name} className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Heart className="w-12 h-12 text-[#2d5c3f]" />
                    </div>
                  )}
                  {charity.is_featured && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full badge-gold text-xs">
                      <Star className="w-3 h-3" />
                      Featured
                    </div>
                  )}
                  {charity.logo_url && (
                    <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl overflow-hidden border border-[#2d5c3f] bg-white">
                      <img src={charity.logo_url} alt={charity.name} className="w-full h-full object-contain p-1" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display font-bold text-white text-lg">{charity.name}</h3>
                    {charity.category && (
                      <span className="text-xs px-2 py-1 rounded-full border border-[#1f3527] text-[#7aad8a] whitespace-nowrap">
                        {charity.category}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[#7aad8a] leading-relaxed mb-4 line-clamp-3">
                    {charity.description}
                  </p>

                  {/* Upcoming events */}
                  {charity.upcoming_events?.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-[#172219] border border-[#1f3527]">
                      <div className="text-xs text-[#4ade80] uppercase tracking-wider mb-2">Upcoming Events</div>
                      {charity.upcoming_events.slice(0, 2).map((event, j) => (
                        <div key={j} className="text-xs text-[#7aad8a]">
                          • {typeof event === 'string' ? event : event.name || JSON.stringify(event)}
                        </div>
                      ))}
                    </div>
                  )}

                  {charity.total_raised > 0 && (
                    <div className="text-sm text-[#4ade80] font-semibold mb-4">
                      £{parseFloat(charity.total_raised).toLocaleString()} raised
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[#1f3527]">
                  {charity.website && (
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-[#7aad8a] hover:text-[#4ade80] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </a>
                  )}
                  <Link href="/subscribe" className="ml-auto btn-primary text-xs py-2 px-4">
                    Support This
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6">
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
