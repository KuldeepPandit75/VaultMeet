'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useEventStore from "@/Zustand_Store/EventStore";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "./style.css";

type EventType = 'hackathon' | 'workshop' | 'webinar' | 'tech-talk' | 'other';
type EventMode = 'online' | 'offline' | 'hybrid';
type TargetAudience = 'students' | 'professionals' | 'startups' | 'all';
type Industry = 'technology' | 'finance' | 'healthcare' | 'education' | 'retail' | 'manufacturing' | 'other';
type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

interface Stage {
  stageName: string;
  stageDescription: string;
  stageStartDate: string;
  stageEndDate: string;
  onHackMeet: boolean;
}

export default function CompanyHostPage() {
  const router = useRouter();
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { createEvent, uploadCompanyLogo, uploadEventBanner, uploadMarketingMaterials, loading, error } = useEventStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    companyWebsite: '',
    industry: '' as Industry,
    companyLogo: null as File | null,
    
    // Contact Information
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    socialProfiles: '',
    
    // Event Details
    eventName: '',
    eventBanner: null as File | null,
    eventType: '' as EventType,
    description: '',
    eventMode: '' as EventMode,
    startDate: '',
    endDate: '',
    duration: '',
    targetAudience: '' as TargetAudience,
    maxParticipants: '',
    
    // Stages
    stages: [] as Stage[],
    
    // Venue Details
    venueName: '',
    venueAddress: '',
    venueCity: '',
    venueState: '',
    venueCountry: '',
    venueContact: '',
    
    // Incentives & Prizes
    hasPrizes: 'no',
    prizePool: '',
    prize1: '',
    prize2: '',
    prize3: '',
    prizeDetails: '',
    
    // Sponsors
    sponsors: [] as Array<{
      name: string;
      logo: File | null;
      website: string;
    }>,
    
    // Promotion
    needsPromotion: 'no',
    marketingMaterials: null as FileList | null,
    additionalNotes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Upload files first
      const [logoUrl, bannerUrl, marketingUrls] = await Promise.all([
        formData.companyLogo ? uploadCompanyLogo(formData.companyLogo) : Promise.resolve(''),
        formData.eventBanner ? uploadEventBanner(formData.eventBanner) : Promise.resolve(''),
        formData.marketingMaterials ? uploadMarketingMaterials(Array.from(formData.marketingMaterials)) : Promise.resolve([])
      ]);

      // Upload sponsor logos
      const sponsorLogos = await Promise.all(
        formData.sponsors.map(async (sponsor) => {
          if (sponsor.logo) {
            const logoUrl = await uploadCompanyLogo(sponsor.logo);
            return { ...sponsor, logo: logoUrl };
          }
          return sponsor;
        })
      );

      // Prepare event data
      const eventData = {
        company: {
          name: formData.companyName,
          website: formData.companyWebsite,
          industry: formData.industry,
          logo: logoUrl
        },
        contact: {
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone,
          socialProfiles: formData.socialProfiles
        },
        name: formData.eventName,
        banner: bannerUrl,
        type: formData.eventType,
        description: formData.description,
        mode: formData.eventMode,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        duration: formData.duration,
        targetAudience: formData.targetAudience,
        maxParticipants: parseInt(formData.maxParticipants),
        venue: formData.eventMode !== 'online' ? {
          name: formData.venueName,
          address: formData.venueAddress,
          city: formData.venueCity,
          state: formData.venueState,
          country: formData.venueCountry,
          contactPerson: formData.venueContact
        } : undefined,
        prizes: {
          hasPrizes: formData.hasPrizes === 'yes',
          prizePool: formData.prizePool,
          prize1: formData.prize1,
          prize2: formData.prize2,
          prize3: formData.prize3,
          details: formData.prizeDetails
        },
        sponsors: sponsorLogos,
        promotion: {
          needsPromotion: formData.needsPromotion === 'yes',
          marketingMaterials: marketingUrls
        },
        additionalNotes: formData.additionalNotes,
        status: 'draft' as EventStatus,
        stats: {
          registeredParticipants: 0,
          approvedParticipants: 0
        },
        stages: formData.stages.map(stage => ({
          ...stage,
          stageStartDate: new Date(stage.stageStartDate),
          stageEndDate: stage.stageEndDate ? new Date(stage.stageEndDate) : undefined
        })),
      };

      // Create event
      await createEvent(eventData);
      
      // Redirect to success page or dashboard
      router.push('/host/dashboard');
    } catch (error) {
      console.error('Error creating event:', error);
      // Handle error (you might want to show an error message to the user)
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0] // Get the first file only
      });
    }
  };

  // const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files) {
  //     setFormData({
  //       ...formData,
  //       [e.target.name]: e.target.files // Keep the entire FileList
  //     });
  //   }
  // };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleAddSponsor = () => {
    setFormData(prev => ({
      ...prev,
      sponsors: [...prev.sponsors, { name: '', logo: null, website: '' }]
    }));
  };

  const handleRemoveSponsor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index)
    }));
  };

  const handleSponsorChange = (index: number, field: string, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.map((sponsor, i) => 
        i === index ? { ...sponsor, [field]: value } : sponsor
      )
    }));
  };

  const handleAddStage = () => {
    setFormData(prev => ({
      ...prev,
      stages: [...prev.stages, {
        stageName: '',
        stageDescription: '',
        stageStartDate: '',
        stageEndDate: '',
        onHackMeet: false
      }]
    }));
  };

  const handleRemoveStage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index)
    }));
  };

  const handleStageChange = (index: number, field: keyof Stage, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => 
        i === index ? { ...stage, [field]: value } : stage
      )
    }));
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="p-6 rounded-xl" style={{ backgroundColor: `${primaryAccentColor}20` }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: primaryAccentColor }}>
              Company Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Website URL</label>
                <input
                  type="url"
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Industry</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white text-white"
                  required
                >
                  <option value="" className='option'>Select Industry</option>
                  <option value="technology" className='option'>Technology</option>
                  <option value="finance" className='option'>Finance</option>
                  <option value="healthcare" className='option'>Healthcare</option>
                  <option value="education" className='option'>Education</option>
                  <option value="retail" className='option'>Retail</option>
                  <option value="manufacturing" className='option'>Manufacturing</option>
                  <option value="other" className='option'>Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Company Logo</label>
                <input
                  type="file"
                  name="companyLogo"
                  onChange={handleSingleFileChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  accept="image/*"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="p-6 rounded-xl" style={{ backgroundColor: `${primaryAccentColor}20` }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: primaryAccentColor }}>
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Point of Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Phone Number</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>LinkedIn / Social Profiles (Optional)</label>
                <input
                  type="text"
                  name="socialProfiles"
                  value={formData.socialProfiles}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="p-6 rounded-xl" style={{ backgroundColor: `${primaryAccentColor}20` }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: primaryAccentColor }}>
              Event Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Event Name</label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Event Banner Image</label>
                <input
                  type="file"
                  name="eventBanner"
                  onChange={handleSingleFileChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  accept="image/*"
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Type of Event</label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white text-white"
                  required
                >
                  <option value="" className='option'>Select Event Type</option>
                  <option value="hackathon" className='option'>Hackathon</option>
                  <option value="workshop" className='option'>Workshop</option>
                  <option value="webinar" className='option'>Webinar</option>
                  <option value="tech-talk" className='option'>Tech Talk</option>
                  <option value="other" className='option'>Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Event Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white h-32"
                  required
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Event Mode</label>
                <select
                  name="eventMode"
                  value={formData.eventMode}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white text-white"
                  required
                >
                  <option value="" className='option'>Select Event Mode</option>
                  <option value="online" className='option'>Online</option>
                  <option value="offline" className='option'>Offline</option>
                  <option value="hybrid" className='option'>Hybrid</option>
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>Start Date</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>End Date</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Duration (in hours or days)</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Target Audience</label>
                <select
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white text-white"
                  required
                >
                  <option value="" className='option'>Select Target Audience</option>
                  <option value="students" className='option'>Students</option>
                  <option value="professionals" className='option'>Professionals</option>
                  <option value="startups" className='option'>Startups</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Expected Number of Participants</label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold" style={{ color: secondaryAccentColor }}>Event Stages</h3>
                {formData.stages.map((stage, index) => (
                  <div key={index} className="p-4 border border-white rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold" style={{ color: secondaryAccentColor }}>Stage {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2" style={{ color: secondaryAccentColor }}>Stage Name</label>
                        <input
                          type="text"
                          value={stage.stageName}
                          onChange={(e) => handleStageChange(index, 'stageName', e.target.value)}
                          className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2" style={{ color: secondaryAccentColor }}>Stage Description</label>
                        <textarea
                          value={stage.stageDescription}
                          onChange={(e) => handleStageChange(index, 'stageDescription', e.target.value)}
                          className="w-full p-2 rounded-lg border border-white bg-transparent text-white h-32"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2" style={{ color: secondaryAccentColor }}>Start Date</label>
                          <input
                            type="datetime-local"
                            value={stage.stageStartDate}
                            onChange={(e) => handleStageChange(index, 'stageStartDate', e.target.value)}
                            className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block mb-2" style={{ color: secondaryAccentColor }}>End Date</label>
                          <input
                            type="datetime-local"
                            value={stage.stageEndDate}
                            onChange={(e) => handleStageChange(index, 'stageEndDate', e.target.value)}
                            className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`onHackMeet-${index}`}
                          checked={stage.onHackMeet}
                          onChange={(e) => handleStageChange(index, 'onHackMeet', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor={`onHackMeet-${index}`} style={{ color: secondaryAccentColor }}>
                          Host this stage on HackMeet
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: `${primaryAccentColor}40`, color: primaryAccentColor }}
                >
                  Add Stage
                </button>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="p-6 rounded-xl" style={{ backgroundColor: `${primaryAccentColor}20` }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: primaryAccentColor }}>
              Additional Details
            </h2>
            <div className="space-y-4">
              {(formData.eventMode === 'offline' || formData.eventMode === 'hybrid') && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold" style={{ color: secondaryAccentColor }}>Venue Details</h3>
                  <div>
                    <label className="block mb-2" style={{ color: secondaryAccentColor }}>Venue Name</label>
                    <input
                      type="text"
                      name="venueName"
                      value={formData.venueName}
                      onChange={handleChange}
                      className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: secondaryAccentColor }}>Address</label>
                    <input
                      type="text"
                      name="venueAddress"
                      value={formData.venueAddress}
                      onChange={handleChange}
                      className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2" style={{ color: secondaryAccentColor }}>City</label>
                      <input
                        type="text"
                        name="venueCity"
                        value={formData.venueCity}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ color: secondaryAccentColor }}>State</label>
                      <input
                        type="text"
                        name="venueState"
                        value={formData.venueState}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ color: secondaryAccentColor }}>Country</label>
                      <input
                        type="text"
                        name="venueCountry"
                        value={formData.venueCountry}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: secondaryAccentColor }}>Venue Contact Person</label>
                    <input
                      type="text"
                      name="venueContact"
                      value={formData.venueContact}
                      onChange={handleChange}
                      className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold" style={{ color: secondaryAccentColor }}>Incentives & Prizes</h3>
                <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>Will there be prizes or incentives?</label>
                  <select
                    name="hasPrizes"
                    value={formData.hasPrizes}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white text-white"
                    required
                  >
                    <option value="yes" className='option'>Yes</option>
                    <option value="no" className='option'>No</option>
                  </select>
                </div>
                {formData.hasPrizes === 'yes' && (
                  <>
                    <div>
                      <label className="block mb-2" style={{ color: secondaryAccentColor }}>Prize Pool</label>
                      <input
                        type="text"
                        name="prizePool"
                        value={formData.prizePool}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ color: secondaryAccentColor }}>First Prize</label>
                      <input
                        type="text"
                        name="prize1"
                        value={formData.prize1}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ color: secondaryAccentColor }}>Second Prize</label>
                      <input
                        type="text"
                        name="prize2"
                        value={formData.prize2}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ color: secondaryAccentColor }}>Third Prize</label>
                      <input
                        type="text"
                        name="prize3"
                        value={formData.prize3}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ color: secondaryAccentColor }}>Additional Prize Details</label>
                      <textarea
                        name="prizeDetails"
                        value={formData.prizeDetails}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white h-32"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold" style={{ color: secondaryAccentColor }}>Sponsors</h3>
                {formData.sponsors.map((sponsor, index) => (
                  <div key={index} className="p-4 border border-white rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold" style={{ color: secondaryAccentColor }}>Sponsor {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveSponsor(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2" style={{ color: secondaryAccentColor }}>Sponsor Name</label>
                        <input
                          type="text"
                          value={sponsor.name}
                          onChange={(e) => handleSponsorChange(index, 'name', e.target.value)}
                          className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2" style={{ color: secondaryAccentColor }}>Sponsor Logo</label>
                        <input
                          type="file"
                          onChange={(e) => handleSponsorChange(index, 'logo', e.target.files?.[0] || null)}
                          className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                          accept="image/*"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2" style={{ color: secondaryAccentColor }}>Website URL</label>
                        <input
                          type="url"
                          value={sponsor.website}
                          onChange={(e) => handleSponsorChange(index, 'website', e.target.value)}
                          className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddSponsor}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: `${primaryAccentColor}40`, color: primaryAccentColor }}
                >
                  Add Sponsor
                </button>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold" style={{ color: secondaryAccentColor }}>Promotion & Outreach</h3>
                <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>Do you want us to promote your event?</label>
                  <select
                    name="needsPromotion"
                    value={formData.needsPromotion}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white text-white"
                    required
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                {/* <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>Marketing Materials Upload</label>
                  <input
                    type="file"
                    name="marketingMaterials"
                    onChange={handleMultipleFileChange}
                    className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    accept="image/*,video/*"
                    multiple
                  />
                </div> */}
                <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>Any Other Requirements or Notes</label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white bg-transparent text-white h-32"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500 text-white mb-8">
            {error}
          </div>
        )}
        <h1 className="text-3xl font-bold mb-8" style={{ color: primaryAccentColor }}>
          Host an Event
        </h1>
        
        <form onSubmit={handleSubmit}>
          {renderStep()}
          
          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 rounded-lg"
                style={{ backgroundColor: `${primaryAccentColor}40`, color: primaryAccentColor }}
              >
                Previous
              </button>
            )}
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 rounded-lg"
                style={{ backgroundColor: primaryAccentColor, color: 'white' }}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-lg"
                style={{ backgroundColor: primaryAccentColor, color: 'white' }}
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </button>
            )}
          </div>
        </form>

        
      </div>
    </div>
  );
} 