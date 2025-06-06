'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { useState } from "react";

export default function StudentHostPage() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const [formData, setFormData] = useState({
    collegeName: '',
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    hackathonName: '',
    description: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    isVirtual: 'yes',
    venue: '',
    expectedBudget: '',
    facultyCoordinator: '',
    facultyEmail: '',
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
          style={{ color: secondaryAccentColor }}
        >
          Host Your College Hackathon
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div 
            className="p-6 rounded-xl"
            style={{ backgroundColor: `${primaryAccentColor}20` }}
          >
            <h2 
              className="text-2xl font-semibold mb-4"
              style={{ color: secondaryAccentColor }}
            >
              Student Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-white">College Name</label>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-white">Your Name</label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-white">Your Email</label>
                <input
                  type="email"
                  name="studentEmail"
                  value={formData.studentEmail}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-white">Your Phone</label>
                <input
                  type="tel"
                  name="studentPhone"
                  value={formData.studentPhone}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Hackathon Details */}
          <div 
            className="p-6 rounded-xl"
            style={{ backgroundColor: `${primaryAccentColor}20` }}
          >
            <h2 
              className="text-2xl font-semibold mb-4"
              style={{ color: secondaryAccentColor }}
            >
              Hackathon Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-white">Hackathon Name</label>
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
                <label className="block mb-2 text-white">Description</label>
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
                  <label className="block mb-2 text-white">Start Date</label>
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
                  <label className="block mb-2 text-white">End Date</label>
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
                  <label className="block mb-2 text-white">Maximum Participants</label>
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
                  <label className="block mb-2 text-white">Expected Budget (USD)</label>
                  <input
                    type="number"
                    name="expectedBudget"
                    value={formData.expectedBudget}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-white">Is this a Virtual Hackathon?</label>
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
                  <label className="block mb-2 text-white">Venue</label>
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

          {/* Faculty Coordinator */}
          <div 
            className="p-6 rounded-xl"
            style={{ backgroundColor: `${primaryAccentColor}20` }}
          >
            <h2 
              className="text-2xl font-semibold mb-4"
              style={{ color: secondaryAccentColor }}
            >
              Faculty Coordinator
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-white">Coordinator Name</label>
                <input
                  type="text"
                  name="facultyCoordinator"
                  value={formData.facultyCoordinator}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-white">Coordinator Email</label>
                <input
                  type="email"
                  name="facultyEmail"
                  value={formData.facultyEmail}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-lg transition-transform hover:scale-105"
            style={{ 
              background: `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
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