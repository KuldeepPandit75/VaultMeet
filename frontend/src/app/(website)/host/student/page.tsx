'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useEventStore from "@/Zustand_Store/EventStore";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type EventType = 'hackathon' | 'workshop' | 'webinar' | 'tech-talk' | 'other';
type EventMode = 'online' | 'offline' | 'hybrid';
type TargetAudience = 'students' | 'professionals' | 'startups' | 'all';
type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

interface Stage {
  stageName: string;
  stageDescription: string;
  stageStartDate: string;
  stageEndDate: string;
  onHackMeet: boolean;
}

export default function StudentHostPage() {
  const router = useRouter();
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { createEvent, uploadCompanyLogo, uploadEventBanner, loading, error } = useEventStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug currentStep changes
  useEffect(() => {
    console.log('Current step changed to:', currentStep);
  }, [currentStep]);
  const [formData, setFormData] = useState({
    // College Information (instead of company)
    collegeName: '',
    collegeWebsite: '',
    collegeLogo: null as File | null,
    
    // Student Contact Information
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    studentSocialProfiles: '',
    
    // Faculty Coordinator
    facultyCoordinator: '',
    facultyEmail: '',
    facultyPhone: '',
    
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
    
    // Budget & Prizes
    expectedBudget: '',
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
    needsPromotion: 'yes',
    additionalNotes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Form submitted! Current step:', currentStep);
    
    // Only allow submission on the final step
    if (currentStep !== 4) {
      console.log('Preventing submission - not on final step');
      return;
    }

    if (isSubmitting) {
      console.log('Already submitting, preventing duplicate submission');
      return;
    }

    setIsSubmitting(true);
    console.log('Proceeding with form submission...');

    try {
      // Upload files first
      const [logoUrl, bannerUrl] = await Promise.all([
        formData.collegeLogo ? uploadCompanyLogo(formData.collegeLogo) : Promise.resolve(''),
        formData.eventBanner ? uploadEventBanner(formData.eventBanner) : Promise.resolve('')
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

      // Prepare event data - format to match backend expectations
      const eventData = {
        company: {
          name: formData.collegeName,
          website: formData.collegeWebsite || 'https://example.edu',
          industry: 'education',
          logo: logoUrl || ''
        },
        contact: {
          name: formData.studentName,
          email: formData.studentEmail,
          phone: formData.studentPhone,
          socialProfiles: formData.studentSocialProfiles
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
          marketingMaterials: []
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
        // Student-specific fields
        createdByType: 'student',
        facultyCoordinator: {
          name: formData.facultyCoordinator,
          email: formData.facultyEmail,
          phone: formData.facultyPhone
        },
        expectedBudget: formData.expectedBudget
      };

      console.log(eventData);

      // Create event
      const createdEvent = await createEvent(eventData);
      
      // Redirect to event-specific dashboard
      router.push(`/host/${createdEvent._id}/dashboard`);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
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
        [e.target.name]: e.target.files[0]
      });
    }
  };

  const nextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Next step clicked. Current step:', currentStep);
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      console.log('Validation passed, moving to next step');
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      console.log('Validation failed, staying on current step');
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.collegeName) {
          toast.error('Please enter college name');
          return false;
        }
        return true;
      case 2:
        if (!formData.studentName || !formData.studentEmail || !formData.studentPhone) {
          toast.error('Please fill in all student information');
          return false;
        }
        if (!formData.facultyCoordinator || !formData.facultyEmail || !formData.facultyPhone) {
          toast.error('Please fill in all faculty coordinator information');
          return false;
        }
        return true;
      case 3:
        if (!formData.eventName || !formData.eventType || !formData.description || 
            !formData.eventMode || !formData.startDate || !formData.endDate || 
            !formData.duration || !formData.targetAudience || !formData.maxParticipants) {
          toast.error('Please fill in all event details');
          return false;
        }
        if (!formData.eventBanner) {
          toast.error('Please upload an event banner image');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const prevStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
              College Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>College Name</label>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>College Website (Optional)</label>
                <input
                  type="url"
                  name="collegeWebsite"
                  value={formData.collegeWebsite}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>College Logo (Optional)</label>
                <input
                  type="file"
                  name="collegeLogo"
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
              Student & Faculty Information
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: secondaryAccentColor }}>Student Organizer</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2" style={{ color: secondaryAccentColor }}>Your Name</label>
                    <input
                      type="text"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleChange}
                      className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: secondaryAccentColor }}>Your Email</label>
                    <input
                      type="email"
                      name="studentEmail"
                      value={formData.studentEmail}
                      onChange={handleChange}
                      className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: secondaryAccentColor }}>Your Phone</label>
                    <input
                      type="tel"
                      name="studentPhone"
                      value={formData.studentPhone}
                      onChange={handleChange}
                      className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: secondaryAccentColor }}>LinkedIn / Social Profiles (Optional)</label>
                    <input
                      type="text"
                      name="studentSocialProfiles"
                      value={formData.studentSocialProfiles}
                      onChange={handleChange}
                      className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: secondaryAccentColor }}>Faculty Coordinator</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2" style={{ color: secondaryAccentColor }}>Faculty Name</label>
                    <input
                      type="text"
                      name="facultyCoordinator"
                      value={formData.facultyCoordinator}
                      onChange={handleChange}
                      className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: secondaryAccentColor }}>Faculty Email</label>
                    <input
                      type="email"
                      name="facultyEmail"
                      value={formData.facultyEmail}
                      onChange={handleChange}
                      className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: secondaryAccentColor }}>Faculty Phone</label>
                    <input
                      type="tel"
                      name="facultyPhone"
                      value={formData.facultyPhone}
                      onChange={handleChange}
                      className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    />
                  </div>
                </div>
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
                  style={{ backgroundColor: 'transparent' }}
                >
                  <option value="" style={{ backgroundColor: '#333', color: 'white' }}>Select Event Type</option>
                  <option value="hackathon" style={{ backgroundColor: '#333', color: 'white' }}>Hackathon</option>
                  <option value="workshop" style={{ backgroundColor: '#333', color: 'white' }}>Workshop</option>
                  <option value="webinar" style={{ backgroundColor: '#333', color: 'white' }}>Webinar</option>
                  <option value="tech-talk" style={{ backgroundColor: '#333', color: 'white' }}>Tech Talk</option>
                  <option value="other" style={{ backgroundColor: '#333', color: 'white' }}>Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Event Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white h-32"
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Event Mode</label>
                <select
                  name="eventMode"
                  value={formData.eventMode}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white text-white"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <option value="" style={{ backgroundColor: '#333', color: 'white' }}>Select Event Mode</option>
                  <option value="online" style={{ backgroundColor: '#333', color: 'white' }}>Online</option>
                  <option value="offline" style={{ backgroundColor: '#333', color: 'white' }}>Offline</option>
                  <option value="hybrid" style={{ backgroundColor: '#333', color: 'white' }}>Hybrid</option>
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
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Duration (e.g., &quot;48 hours&quot;, &quot;2 days&quot;)</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Target Audience</label>
                <select
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white text-white"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <option value="" style={{ backgroundColor: '#333', color: 'white' }}>Select Target Audience</option>
                  <option value="students" style={{ backgroundColor: '#333', color: 'white' }}>Students</option>
                  <option value="professionals" style={{ backgroundColor: '#333', color: 'white' }}>Professionals</option>
                  <option value="startups" style={{ backgroundColor: '#333', color: 'white' }}>Startups</option>
                  <option value="all" style={{ backgroundColor: '#333', color: 'white' }}>All</option>
                </select>
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Maximum Participants</label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Expected Budget (USD)</label>
                <input
                  type="number"
                  name="expectedBudget"
                  value={formData.expectedBudget}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                />
              </div>

              {/* Event Stages */}
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
                    />
                  </div>
                </div>
              )}

              {/* Prizes & Incentives */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold" style={{ color: secondaryAccentColor }}>Prizes & Incentives</h3>
                <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>Will there be prizes or incentives?</label>
                  <select
                    name="hasPrizes"
                    value={formData.hasPrizes}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white text-white"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <option value="yes" style={{ backgroundColor: '#333', color: 'white' }}>Yes</option>
                    <option value="no" style={{ backgroundColor: '#333', color: 'white' }}>No</option>
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
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ color: secondaryAccentColor }}>Additional Prize Details</label>
                      <textarea
                        name="prizeDetails"
                        value={formData.prizeDetails}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white h-32"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Sponsors */}
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
                        />
                      </div>
                      <div>
                        <label className="block mb-2" style={{ color: secondaryAccentColor }}>Sponsor Logo</label>
                        <input
                          type="file"
                          onChange={(e) => handleSponsorChange(index, 'logo', e.target.files?.[0] || null)}
                          className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                          accept="image/*"
                        />
                      </div>
                      <div>
                        <label className="block mb-2" style={{ color: secondaryAccentColor }}>Website URL</label>
                        <input
                          type="url"
                          value={sponsor.website}
                          onChange={(e) => handleSponsorChange(index, 'website', e.target.value)}
                          className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
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

              {/* Promotion & Additional Notes */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold" style={{ color: secondaryAccentColor }}>Promotion & Notes</h3>
                <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>Do you want us to promote your event?</label>
                  <select
                    name="needsPromotion"
                    value={formData.needsPromotion}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white text-white"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <option value="yes" style={{ backgroundColor: '#333', color: 'white' }}>Yes</option>
                    <option value="no" style={{ backgroundColor: '#333', color: 'white' }}>No</option>
                  </select>
                </div>
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
    <div className="min-h-screen px-[80px] py-[40px] text-white">
      <style jsx global>{`
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        input[type="datetime-local"]::-webkit-datetime-edit {
          color: white;
        }
        input[type="datetime-local"]::-webkit-datetime-edit-fields-wrapper {
          color: white;
        }
        input[type="datetime-local"]::-webkit-datetime-edit-text {
          color: white;
        }
        input[type="datetime-local"]::-webkit-datetime-edit-year-field {
          color: white;
        }
        input[type="datetime-local"]::-webkit-datetime-edit-month-field {
          color: white;
        }
        input[type="datetime-local"]::-webkit-datetime-edit-day-field {
          color: white;
        }
        input[type="datetime-local"]::-webkit-datetime-edit-hour-field {
          color: white;
        }
        input[type="datetime-local"]::-webkit-datetime-edit-minute-field {
          color: white;
        }
        input[type="datetime-local"]::-webkit-datetime-edit-second-field {
          color: white;
        }
        input[type="datetime-local"]::-webkit-datetime-edit-ampm-field {
          color: white;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500 text-white mb-8">
            {error}
          </div>
        )}
        <h1 
          className="text-4xl font-bold mb-8 text-center"
          style={{ color: secondaryAccentColor }}
        >
          Host Your College Event
        </h1>

        <form onSubmit={handleSubmit} noValidate key={`form-step-${currentStep}`}>
          <div>
            {renderStep()}
          </div>
          
          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={(e) => prevStep(e)}
                className="px-6 py-2 rounded-lg"
                style={{ backgroundColor: `${primaryAccentColor}40`, color: primaryAccentColor }}
              >
                Previous
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={(e) => nextStep(e)}
                className="px-6 py-2 rounded-lg ml-auto"
                style={{ backgroundColor: primaryAccentColor, color: 'white' }}
              >
                Next (Step {currentStep})
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="px-6 py-2 rounded-lg ml-auto"
                style={{ backgroundColor: primaryAccentColor, color: 'white' }}
              >
                {loading || isSubmitting ? 'Creating Event...' : 'Create Event'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 