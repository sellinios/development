'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  nationality: string;
  otherNationality: string;
  currentRank: string;
  otherCurrentRank: string;
  positionApplying: string;
  otherPositionApplying: string;
  preferredShipType: string;
  otherPreferredShipType: string;
  address: string;
  telephone: string;
  dateOfBirth: string;
};

type FormErrors = {
  [key in keyof FormData]?: string;
};

export default function CareersPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    nationality: '',
    otherNationality: '',
    currentRank: '',
    otherCurrentRank: '',
    positionApplying: '',
    otherPositionApplying: '',
    preferredShipType: '',
    otherPreferredShipType: '',
    address: '',
    telephone: '',
    dateOfBirth: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Check required fields
    const requiredFields: (keyof FormData)[] = [
      'firstName', 'lastName', 'email', 'address', 'telephone', 'dateOfBirth'
    ];

    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = 'This field is required';
        isValid = false;
      }
    });

    // Check nationality
    if (!formData.nationality) {
      newErrors.nationality = 'This field is required';
      isValid = false;
    } else if (formData.nationality === 'Other' && !formData.otherNationality.trim()) {
      newErrors.otherNationality = 'Please specify your nationality';
      isValid = false;
    }

    // Check current rank
    if (!formData.currentRank) {
      newErrors.currentRank = 'This field is required';
      isValid = false;
    } else if (formData.currentRank === 'Other' && !formData.otherCurrentRank.trim()) {
      newErrors.otherCurrentRank = 'Please specify your current rank';
      isValid = false;
    }

    // Check position applying
    if (!formData.positionApplying) {
      newErrors.positionApplying = 'This field is required';
      isValid = false;
    } else if (formData.positionApplying === 'Other' && !formData.otherPositionApplying.trim()) {
      newErrors.otherPositionApplying = 'Please specify the position';
      isValid = false;
    }

    // Check preferred ship type
    if (!formData.preferredShipType) {
      newErrors.preferredShipType = 'This field is required';
      isValid = false;
    } else if (formData.preferredShipType === 'Other' && !formData.otherPreferredShipType.trim()) {
      newErrors.otherPreferredShipType = 'Please specify the ship type';
      isValid = false;
    }

    // Validate email format
    if (formData.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Process form data for submission
      const submissionData = {
        ...formData,
        // Replace dropdown values with "Other" text field values when appropriate
        nationality: formData.nationality === 'Other' ? formData.otherNationality : formData.nationality,
        currentRank: formData.currentRank === 'Other' ? formData.otherCurrentRank : formData.currentRank,
        positionApplying: formData.positionApplying === 'Other' ? formData.otherPositionApplying : formData.positionApplying,
        preferredShipType: formData.preferredShipType === 'Other' ? formData.otherPreferredShipType : formData.preferredShipType
      };

      // Submit to Intranet API
      const response = await fetch('https://site.epsilonhellas.com/intranet/api/career-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
      } else {
        console.error('Form submission failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ranks = [
    'Master',
    'Chief officer',
    'Second officer',
    'Third officer',
    'Chief engineer',
    'Second engineer',
    'Third engineer',
    'Fourth engineer',
    'Gas engineer',
    'Reefer engineer',
    'Electrician',
    'ETO',
    'Bosun',
    'Pumpman',
    'Fitter/Welder',
    'AB',
    'OS',
    'Oiler',
    'Wiper',
    'Cook',
    'Messman',
    'Deck Cadet',
    'Engine Cadet',
    'Other'
  ];

  const shipTypes = ['Bulk Carrier', 'Container Ship', 'Tanker', 'LNG Carrier', 'Cruise Ship', 'Passenger Ferry', 'Ro-Ro', 'General Cargo', 'Offshore Supply Vessel', 'Fishing Vessel', 'Other'];

  const nationalities = ['Filipino', 'Indian', 'Russian', 'Ukrainian', 'Polish', 'Greek', 'British', 'Croatian', 'American', 'Chinese', 'Indonesian', 'Other'];

  if (submitSuccess) {
    return (
      <div className="max-w-7xl mx-auto p-8 font-sans">
        <h1 className="text-center text-3xl text-gray-800 mb-4 uppercase font-bold">Thank You For Your Application</h1>
        <p className="text-center mb-6">Your application has been submitted successfully. Our team will review your information and contact you shortly.</p>
        <button
          className="bg-[#003070] text-white border-none rounded px-6 py-3 text-base cursor-pointer transition-colors hover:bg-blue-800 uppercase font-semibold tracking-wide mx-auto block"
          onClick={() => setSubmitSuccess(false)}
        >
          Submit Another Application
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans">
      <h1 className="text-center text-3xl text-gray-800 mb-4 uppercase font-bold">CAREERS AVAILABLE. APPLY TODAY!</h1>
      <div className="border-b-2 border-[#003070] w-12 mx-auto mb-8"></div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex gap-6 flex-col md:flex-row">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="firstName" className="font-medium text-gray-800">Your Name (required)</label>
            <input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900"
            />
            {errors.firstName && <span className="text-red-500 text-sm mt-1">{errors.firstName}</span>}
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="lastName" className="font-medium text-gray-800">Your Surname (required)</label>
            <input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900"
            />
            {errors.lastName && <span className="text-red-500 text-sm mt-1">{errors.lastName}</span>}
          </div>
        </div>

        <div className="flex gap-6 flex-col md:flex-row">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="email" className="font-medium text-gray-800">Your Email (required)</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900"
            />
            {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="nationality" className="font-medium text-gray-800">Nationality (required)</label>
            <select
              id="nationality"
              name="nationality"
              value={formData.nationality}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900"
            >
              <option value="" disabled>Select your nationality</option>
              {nationalities.map((nationality) => (
                <option key={nationality} value={nationality}>{nationality}</option>
              ))}
            </select>
            {errors.nationality && <span className="text-red-500 text-sm mt-1">{errors.nationality}</span>}

            {formData.nationality === 'Other' && (
              <div className="mt-2">
                <input
                  name="otherNationality"
                  value={formData.otherNationality}
                  onChange={handleInputChange}
                  placeholder="Please specify your nationality"
                  className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900 w-full"
                />
                {errors.otherNationality && <span className="text-red-500 text-sm mt-1">{errors.otherNationality}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6 flex-col md:flex-row">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="currentRank" className="font-medium text-gray-800">Current Rank (required)</label>
            <select
              id="currentRank"
              name="currentRank"
              value={formData.currentRank}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900"
            >
              <option value="" disabled>Select your current rank</option>
              {ranks.map((rank) => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
            {errors.currentRank && <span className="text-red-500 text-sm mt-1">{errors.currentRank}</span>}

            {formData.currentRank === 'Other' && (
              <div className="mt-2">
                <input
                  name="otherCurrentRank"
                  value={formData.otherCurrentRank}
                  onChange={handleInputChange}
                  placeholder="Please specify your current rank"
                  className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900 w-full"
                />
                {errors.otherCurrentRank && <span className="text-red-500 text-sm mt-1">{errors.otherCurrentRank}</span>}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="positionApplying" className="font-medium text-gray-800">Position to apply for (required)</label>
            <select
              id="positionApplying"
              name="positionApplying"
              value={formData.positionApplying}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900"
            >
              <option value="" disabled>Select position</option>
              {ranks.map((rank) => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
            {errors.positionApplying && <span className="text-red-500 text-sm mt-1">{errors.positionApplying}</span>}

            {formData.positionApplying === 'Other' && (
              <div className="mt-2">
                <input
                  name="otherPositionApplying"
                  value={formData.otherPositionApplying}
                  onChange={handleInputChange}
                  placeholder="Please specify the position"
                  className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900 w-full"
                />
                {errors.otherPositionApplying && <span className="text-red-500 text-sm mt-1">{errors.otherPositionApplying}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="preferredShipType" className="font-medium text-gray-800">Preferred Type of Ship(s) (required)</label>
          <select
            id="preferredShipType"
            name="preferredShipType"
            value={formData.preferredShipType}
            onChange={handleInputChange}
            className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900"
          >
            <option value="" disabled>Select ship type</option>
            {shipTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.preferredShipType && <span className="text-red-500 text-sm mt-1">{errors.preferredShipType}</span>}

          {formData.preferredShipType === 'Other' && (
            <div className="mt-2">
              <input
                name="otherPreferredShipType"
                value={formData.otherPreferredShipType}
                onChange={handleInputChange}
                placeholder="Please specify the ship type"
                className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900 w-full"
              />
              {errors.otherPreferredShipType && <span className="text-red-500 text-sm mt-1">{errors.otherPreferredShipType}</span>}
            </div>
          )}
        </div>

        <div className="flex gap-6 flex-col md:flex-row">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="address" className="font-medium text-gray-800">Your Address (required)</label>
            <input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900"
            />
            {errors.address && <span className="text-red-500 text-sm mt-1">{errors.address}</span>}
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="telephone" className="font-medium text-gray-800">Your Telephone (required)</label>
            <input
              id="telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900"
            />
            {errors.telephone && <span className="text-red-500 text-sm mt-1">{errors.telephone}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="dateOfBirth" className="font-medium text-gray-800">Your Date of Birth (required)</label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className="p-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-900"
            placeholder="mm/dd/yyyy"
          />
          {errors.dateOfBirth && <span className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</span>}
        </div>

        <button
          type="submit"
          className="bg-[#003070] text-white border-none rounded px-6 py-3 text-base cursor-pointer transition-colors hover:bg-blue-800 uppercase font-semibold tracking-wide self-start mt-4"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'SENDING...' : 'SEND'}
        </button>
      </form>
    </div>
  );
}