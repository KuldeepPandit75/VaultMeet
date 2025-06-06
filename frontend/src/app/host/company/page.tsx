'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { useState } from "react";

export default function CompanyHostPage() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    hackathonName: '',
    description: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    isVirtual: 'yes',
    venue: '',
    prizePool: '',
    companyWebsite: '',
    companySize: '',
    industry: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
        select option {
          background-color: white;
          color: black;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        <h1 
          className="text-4xl font-bold mb-8 text-center"
          style={{ color: primaryAccentColor }}
        >
          Host Your Company Hackathon
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div 
            className="p-6 rounded-xl"
            style={{ backgroundColor: `${primaryAccentColor}20` }}
          >
            <h2 
              className="text-2xl font-semibold mb-4"
              style={{ color: primaryAccentColor }}
            >
              Company Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
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
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Contact Name</label>
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
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Contact Phone</label>
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
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Company Website</label>
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
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Company Size</label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white text-white"
                  required
                >
                  <option value="">Select Company Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
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
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hackathon Details */}
          <div 
            className="p-6 rounded-xl"
            style={{ backgroundColor: `${secondaryAccentColor}20` }}
          >
            <h2 
              className="text-2xl font-semibold mb-4"
              style={{ color: primaryAccentColor }}
            >
              Hackathon Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Hackathon Name</label>
                <input
                  type="text"
                  name="hackathonName"
                  value={formData.hackathonName}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white h-32"
                  required
                />
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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>Maximum Participants</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>Prize Pool (USD)</label>
                  <input
                    type="number"
                    name="prizePool"
                    value={formData.prizePool}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2" style={{ color: secondaryAccentColor }}>Is this a Virtual Hackathon?</label>
                <select
                  name="isVirtual"
                  value={formData.isVirtual}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white text-white"
                  required
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              {formData.isVirtual === 'no' && (
                <div>
                  <label className="block mb-2" style={{ color: secondaryAccentColor }}>Venue</label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-lg transition-transform hover:scale-105"
            style={{ 
              background: `linear-gradient(90deg, ${primaryAccentColor} 0%, ${secondaryAccentColor} 100%)`,
              color: '#222'
            }}
          >
            Submit Hackathon
          </button>
        </form>
      </div>
    </div>
  );
} 