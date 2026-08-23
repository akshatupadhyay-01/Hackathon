import React, { useState } from 'react';
import { Briefcase, ShieldCheck, CheckCircle2, Leaf, Palette, Home, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { SEO } from '../components/seo';

interface BusinessPageProps {
  navigate: (path: string) => void;
}

export function BusinessPage({ navigate }: BusinessPageProps) {
  const [vendorType, setVendorType] = useState('artisan_craft');
  const [businessName, setBusinessName] = useState('');
  const [district, setDistrict] = useState('Hazaribagh');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [artForm, setArtForm] = useState('Dokra Metal Casting');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-stone-950 py-8 md:py-12">
      <SEO
        title="Host & Partner Registration — Homestays, Artisans & Guides"
        description="Register your tribal homestay, artisan craft workshop, or local guide services with the Jharkhand Eco-Tourism platform. Free onboarding and official district eco-certification."
        keywords="Jharkhand homestay registration, Jharkhand tourist guide partner, artisan onboarding, tourism business Jharkhand"
        canonicalPath="/business"
        ogType="website"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2">
            <Badge variant="emerald" className="gap-1 text-xs">
              <Briefcase className="h-3.5 w-3.5" />
              Jharkhand Tourism Business & Host Onboarding
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Register Your Homestay, Craft, or Guiding Service
          </h1>
          <p className="text-sm md:text-base text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
            Join the official Jharkhand Eco-Tourism marketplace. Direct peer-to-peer bookings, zero intermediary fees, and government eco-certification.
          </p>
        </div>

        <Card className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-lg">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                Application Received!
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{businessName}</strong>. Your listing is now queued for verification by the District Tourism Board. You can monitor verification status in the Admin dashboard.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <Button onClick={() => navigate('/admin')} variant="outline">
                  View in Admin Queue
                </Button>
                <Button onClick={() => navigate('/discover-local')} className="bg-emerald-700">
                  Explore Community
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Category Select */}
              <div className="space-y-2">
                <label className="font-bold text-stone-900 dark:text-stone-100 block">
                  Select Provider Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'artisan_craft', label: 'Tribal Artisan', icon: Palette },
                    { id: 'homestay', label: 'Eco Homestay', icon: Home },
                    { id: 'eco_tour_guide', label: 'Nature Guide', icon: Users },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setVendorType(t.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          vendorType === t.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-200 font-bold'
                            : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business Name */}
              <div className="space-y-1">
                <label className="font-semibold text-stone-800 dark:text-stone-200">
                  Business / Group Name
                </label>
                <Input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Santhal Pargana Sohrai Art Collective"
                  required
                />
              </div>

              {/* District & Village */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 dark:text-stone-200">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2.5 text-xs text-stone-900 dark:text-stone-100"
                  >
                    <option value="Ranchi">Ranchi</option>
                    <option value="Latehar">Latehar</option>
                    <option value="Giridih">Giridih</option>
                    <option value="Deoghar">Deoghar</option>
                    <option value="Ramgarh">Ramgarh</option>
                    <option value="West Singhbhum">West Singhbhum</option>
                    <option value="Hazaribagh">Hazaribagh</option>
                    <option value="Dumka">Dumka</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 dark:text-stone-200">
                    Village / Block / Area
                  </label>
                  <Input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g., Bhelwara Village"
                    required
                  />
                </div>
              </div>

              {/* Phone & Art form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 dark:text-stone-200">
                    Contact Phone (WhatsApp)
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 94311 00000"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 dark:text-stone-200">
                    Art Form / Specialization
                  </label>
                  <Input
                    type="text"
                    value={artForm}
                    onChange={(e) => setArtForm(e.target.value)}
                    placeholder="e.g., Dokra Brass, Sohrai, Forest Guide"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-stone-800 dark:text-stone-200">
                  Description of Offerings
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your craft, materials used, homestay amenities, or guided trek specialties..."
                  rows={3}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-900 dark:text-emerald-200">
                🌱 <strong>Zero Commission Model:</strong> Verified Jharkhand providers receive direct UPI transfers from tourists with zero commission deductions.
              </div>

              <Button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl"
              >
                Submit Listing for Verification
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
