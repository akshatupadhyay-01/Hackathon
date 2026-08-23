import React, { useEffect, useState } from 'react';
import { Palette, Home, Users, ShieldCheck, Star, Heart, CheckCircle2 } from 'lucide-react';
import { Vendor, LocalGuide } from '../types/database';
import { fetchVendors, fetchLocalGuides } from '../services/destinations';
import { VendorCard, GuideCard } from '../components/local-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { SEO } from '../components/seo';

interface DiscoverLocalPageProps {
  navigate: (path: string) => void;
}

export function DiscoverLocalPage({ navigate }: DiscoverLocalPageProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [guides, setGuides] = useState<LocalGuide[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  // Inquire / Booking dialog state
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<LocalGuide | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);

  useEffect(() => {
    async function loadLocalData() {
      setLoading(true);
      try {
        const [vendorsData, guidesData] = await Promise.all([
          fetchVendors(),
          fetchLocalGuides(),
        ]);
        setVendors(vendorsData);
        setGuides(guidesData);
      } catch (err) {
        console.error('Error loading local data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLocalData();
  }, []);

  const artisans = vendors.filter((v) => v.vendor_type === 'artisan_craft');
  const homestays = vendors.filter((v) => v.vendor_type === 'homestay');

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySuccess(true);
  };

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-stone-950 py-8 md:py-12">
      <SEO
        title="Discover Local Artisans, Certified Guides & Tribal Homestays"
        description="Support indigenous tribal communities in Jharkhand. Hire certified local guides speaking Santhali, Ho, and Hindi. Shop handmade Dokra metal craft, Sohrai paintings, and book authentic rural eco-homestays."
        keywords="Jharkhand tribal artisans, Dokra metal art, Sohrai painting, Jharkhand certified tourist guides, Santhal homestay, rural tourism Jharkhand, indigenous crafts"
        canonicalPath="/discover-local"
        ogType="website"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="emerald" className="gap-1 text-xs">
              <Palette className="h-3.5 w-3.5" />
              Community & Cultural Economy
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Tribal Artisans, Homestays & Native Guides
          </h1>
          <p className="text-sm md:text-base text-stone-600 dark:text-stone-400 max-w-3xl">
            Support local livelihoods directly. Browse certified Dokra brass casters, GI-tagged Sohrai painters, eco-homestays, and verified local nature trackers.
          </p>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="max-w-md mx-auto grid grid-cols-3">
            <TabsTrigger value="all">All Community ({vendors.length + guides.length})</TabsTrigger>
            <TabsTrigger value="artisans">Artisans & Crafts ({artisans.length})</TabsTrigger>
            <TabsTrigger value="guides">Native Guides ({guides.length})</TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-8 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Tribal Craft Collectives & Homestays
                </h3>
                <Button variant="link" onClick={() => setActiveTab('artisans')} className="text-xs">
                  View all artisans
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor) => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    onBook={(v) => {
                      setSelectedVendor(v);
                      setInquirySuccess(false);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Certified Tribal Guides
                </h3>
                <Button variant="link" onClick={() => setActiveTab('guides')} className="text-xs">
                  View all guides
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    onHire={(g) => {
                      setSelectedGuide(g);
                      setInquirySuccess(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Artisans Tab */}
          <TabsContent value="artisans" className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {artisans.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onBook={(v) => {
                    setSelectedVendor(v);
                    setInquirySuccess(false);
                  }}
                />
              ))}
            </div>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides" className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  onHire={(g) => {
                    setSelectedGuide(g);
                    setInquirySuccess(false);
                  }}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Inquiry / Booking Modal */}
      <Dialog
        open={Boolean(selectedVendor || selectedGuide)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVendor(null);
            setSelectedGuide(null);
            setInquirySuccess(false);
          }
        }}
      >
        <DialogContent
          className="max-w-md"
          onClose={() => {
            setSelectedVendor(null);
            setSelectedGuide(null);
            setInquirySuccess(false);
          }}
        >
          {inquirySuccess ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto" />
              <DialogTitle className="text-xl font-bold">Inquiry Sent Successfully!</DialogTitle>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                The local cooperative coordinator has received your details and will get in touch via SMS / WhatsApp.
              </p>
              <Button
                onClick={() => {
                  setSelectedVendor(null);
                  setSelectedGuide(null);
                  setInquirySuccess(false);
                }}
                className="w-full bg-emerald-700 mt-4"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit}>
              <DialogHeader>
                <DialogTitle>
                  {selectedVendor
                    ? `Contact ${selectedVendor.business_name}`
                    : `Book ${selectedGuide?.name}`}
                </DialogTitle>
                <DialogDescription>
                  Direct peer-to-peer connection with verified local operators.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 text-xs">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Your Name
                  </label>
                  <Input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <Input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  Zero commission fee: 100% of payment goes directly to the local artisan / guide.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedVendor(null);
                    setSelectedGuide(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 font-bold">
                  Send Booking Request
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
