"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

// Define interfaces for type safety
interface FormData {
  name: string;
  email: string;
  office: string;
  subject: string;
  message: string;
  userCaptcha: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  userCaptcha?: string;
}

// Define office location types
interface OfficeLocation {
  value: string;
  label: string;
}

const officeLocations: OfficeLocation[] = [
  { value: "", label: "Select an office" },
  { value: "cyprus", label: "CYPRUS" },
  { value: "philippines", label: "THE PHILIPPINES" },
  { value: "ukraine", label: "UKRAINE" },
  { value: "georgia", label: "GEORGIA" },
  { value: "russia", label: "RUSSIA" },
  { value: "romania", label: "ROMANIA" },
  { value: "turkey", label: "TURKEY" },
  { value: "indonesia", label: "INDONESIA" },
  { value: "vietnam", label: "VIETNAM" },
  { value: "greece", label: "GREECE" },
];

// Map of office locations to email addresses
const officeEmails: Record<string, string> = {
  "cyprus": "cyprus@epsilonhellas.com",
  "philippines": "philippines@epsilonhellas.com",
  "ukraine": "ukraine@epsilonhellas.com",
  "georgia": "georgia@epsilonhellas.com",
  "russia": "russia@epsilonhellas.com",
  "romania": "romania@epsilonhellas.com",
  "turkey": "turkey@epsilonhellas.com",
  "indonesia": "indonesia@epsilonhellas.com",
  "vietnam": "vietnam@epsilonhellas.com",
  "greece": "info@epsilonhellas.com", // Default for Greece
  "": "info@epsilonhellas.com", // Default for general inquiries
};

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    office: '',
    subject: '',
    message: '',
    userCaptcha: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [captcha, setCaptcha] = useState<string>("");
  const [captchaError, setCaptchaError] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<boolean>(false);

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = (): void => {
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCaptcha(randomChars);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    let tempErrors: FormErrors = {};
    if (!formData.name) tempErrors.name = "Name is required";
    if (!formData.email) {
      tempErrors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      tempErrors.email = "Invalid email address";
    }
    if (!formData.subject) tempErrors.subject = "Subject is required";
    if (!formData.message) tempErrors.message = "Message is required";
    if (!formData.userCaptcha) tempErrors.userCaptcha = "Please enter the captcha";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    if (formData.userCaptcha.toUpperCase() !== captcha) {
      setCaptchaError(true);
      return;
    }

    setCaptchaError(false);
    setSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          targetEmail: officeEmails[formData.office] || officeEmails[""]
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({
          name: '',
          email: '',
          office: '',
          subject: '',
          message: '',
          userCaptcha: ''
        });
        generateCaptcha();
      } else {
        setSubmitError(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8 mt-8">
        <h2 className="text-3xl text-center font-bold text-gray-800 pt-8">What is on your mind? </h2>
        <h2 className="text-3xl text-center font-bold text-gray-800 pt-2 mb-10">Let's talk.</h2>
        <div className="mt-2 text-xl font-medium text-blue-600">GENERAL ENQUIRIES</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Your Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="office" className="block text-sm font-medium text-gray-700">Office Location</label>
          <select
            id="office"
            name="office"
            value={formData.office}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {officeLocations.map((location) => (
              <option key={location.value} value={location.value}>
                {location.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject *</label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={formData.subject}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Your Message *</label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={formData.message}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
        </div>

        <div className="flex items-start space-x-4">
          <div className="flex items-center bg-gray-100 px-3 py-2 rounded">
            <span className="font-mono font-bold tracking-wider text-lg">{captcha}</span>
            <button
              type="button"
              onClick={generateCaptcha}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              ↻
            </button>
          </div>
          <div className="flex-1">
            <label htmlFor="userCaptcha" className="block text-sm font-medium text-gray-700">Not readable? Change text. *</label>
            <input
              id="userCaptcha"
              name="userCaptcha"
              type="text"
              value={formData.userCaptcha}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.userCaptcha && <p className="mt-1 text-sm text-red-600">{errors.userCaptcha}</p>}
            {captchaError && <p className="mt-1 text-sm text-red-600">Incorrect captcha. Please try again.</p>}
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#003070] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        {submitSuccess && (
          <div className="p-4 bg-green-50 rounded-md text-green-800">
            Thank you for your message! We will get back to you shortly.
          </div>
        )}

        {submitError && (
          <div className="p-4 bg-red-50 rounded-md text-red-800">
            There was an error submitting your message. Please try again later.
          </div>
        )}
      </form>
    </div>
  );
};

export default ContactForm;