import React, { useState, useRef, useEffect } from 'react';

const ContractForm = () => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    document_id: '',
    ka_category: '',
    title: '',
    description: '',
    business_unit: [],
    sub_bu: [],
    business_function: [],
    related_contract_types: [],
    applicable_commercial_models: [],
    mapping_with_primary_document_id: '',
    risk_category: '',
    valuethreshol_rules_applied: '',
    last_updated: '',
    version_no: '',
    relevance_tags: []
  });

  const [completedFields, setCompletedFields] = useState([]);
  const formRefs = {
    document_id: useRef(null),
    ka_category: useRef(null),
    title: useRef(null),
    description: useRef(null),
    business_unit: useRef(null),
    sub_bu: useRef(null),
    business_function: useRef(null),
    related_contract_types: useRef(null),
    applicable_commercial_models: useRef(null),
    mapping_with_primary_document_id: useRef(null),
    risk_category: useRef(null),
    valuethreshol_rules_applied: useRef(null),
    last_updated: useRef(null),
    version_no: useRef(null),
    relevance_tags: useRef(null)
  };

  const formFields = [
    { name: 'document_id', label: 'Document ID', type: 'text', required: true },
    { name: 'ka_category', label: 'KA Category', type: 'select', options: [
      'Template', 'Clause', 'Policy', 'Playbook', 'SOP', 'Embedded Guidance'
    ], required: true },
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'business_unit', label: 'Business Unit', type: 'multiselect', options: [
      'Consulting', 'Tax', 'All'
    ], required: true },
    { name: 'sub_bu', label: 'Sub Business Unit', type: 'multiselect', options: [
      'Risk'
    ], required: false },
    { name: 'business_function', label: 'Business Function', type: 'multiselect', options: [
      'Sales', 'Procurement', 'Legal', 'Finance'
    ], required: true },
    { name: 'related_contract_types', label: 'Related Contract Types', type: 'multiselect', options: [
      'MSA', 'SOW', 'NDA'
    ], required: true },
    { name: 'applicable_commercial_models', label: 'Applicable Commercial Models', type: 'multiselect', options: [
      'T&M', 'Fixed Price', 'Loaned Staff', 'Outcome Based'
    ], required: true },
    { name: 'mapping_with_primary_document_id', label: 'Mapping with Primary Document ID', type: 'text', required: false },
    { name: 'risk_category', label: 'Risk Category', type: 'select', options: [
      'Independence', 'Risk Management', 'Cybersecurity'
    ], required: true },
    { name: 'valuethreshol_rules_applied', label: 'Value Threshold Rules Applied', type: 'textarea', required: false },
    { name: 'last_updated', label: 'Last Updated', type: 'date', required: true },
    { name: 'version_no', label: 'Version No', type: 'text', required: true },
    { name: 'relevance_tags', label: 'Relevance Tags', type: 'tags', required: false }
  ];

  useEffect(() => {
    if (currentStep >= 0 && currentStep < formFields.length) {
      const currentRef = formRefs[formFields[currentStep].name];
      if (currentRef.current) {
        const element = currentRef.current;
        const container = element.closest('.overflow-y-auto');
        if (container) {
          const elementPosition = element.getBoundingClientRect().top;
          const containerPosition = container.getBoundingClientRect().top;
          const offset = elementPosition - containerPosition - 100; // 100px offset from top

          container.scrollTo({
            top: container.scrollTop + offset,
            behavior: 'smooth'
          });

          setTimeout(() => {
            element.focus();
          }, 500);
        }
      }
    }
  }, [currentStep]);

  const isFieldValid = (field) => {
    const value = formData[field.name];
    if (!field.required) return true;
    
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== '' && value !== undefined && value !== null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelect = (e) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    
    setFormData(prev => ({
      ...prev,
      [name]: selectedValues
    }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setFormData(prev => ({
      ...prev,
      relevance_tags: tags
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentField = formFields[currentStep];
      if (isFieldValid(currentField)) {
        if (currentStep < formFields.length - 1) {
          handleNext();
        } else {
          handleSubmit(e);
        }
      }
    }
  };

  const handleNext = () => {
    const currentField = formFields[currentStep];
    if (isFieldValid(currentField) && currentStep < formFields.length - 1) {
      setCompletedFields(prev => [...prev, currentField.name]);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCompletedFields(prev => prev.slice(0, -1));
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentField = formFields[currentStep];
    if (isFieldValid(currentField)) {
      console.log(JSON.stringify(formData, null, 2));
    }
  };

  const renderField = (field) => {
    const baseClasses = `w-full p-2 border rounded-md transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' 
        : 'bg-white border-gray-300 text-gray-700'
    }`;
    const activeClasses = darkMode 
      ? 'border-blue-400 ring-2 ring-blue-400 bg-gray-700' 
      : 'border-blue-500 ring-2 ring-blue-500 bg-blue-50';

    switch (field.type) {
      case 'text':
        return (
          <input
            ref={formRefs[field.name]}
            type="text"
            name={field.name}
            value={formData[field.name]}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className={`${baseClasses} ${activeClasses}`}
            required={field.required}
          />
        );
      case 'select':
        return (
          <div className="relative">
            <select
              ref={formRefs[field.name]}
              name={field.name}
              value={formData[field.name]}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className={`${baseClasses} ${activeClasses} appearance-none pr-10 cursor-pointer`}
              required={field.required}
            >
              <option value="" className={darkMode ? 'bg-gray-800' : 'bg-white'}>Select {field.label}</option>
              {field.options.map(option => (
                <option 
                  key={option} 
                  value={option}
                  className={darkMode ? 'bg-gray-800' : 'bg-white'}
                >
                  {option}
                </option>
              ))}
            </select>
            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        );
      case 'textarea':
        return (
          <textarea
            ref={formRefs[field.name]}
            name={field.name}
            value={formData[field.name]}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            rows="4"
            className={`${baseClasses} ${activeClasses}`}
            required={field.required}
          />
        );
      case 'multiselect':
        return (
          <div className="space-y-2">
            <div className="relative">
              <select
                ref={formRefs[field.name]}
                name={field.name}
                multiple
                value={formData[field.name]}
                onChange={handleMultiSelect}
                onKeyPress={handleKeyPress}
                className={`${baseClasses} ${activeClasses} min-h-[120px] cursor-pointer`}
                required={field.required}
              >
                {field.options.map(option => (
                  <option 
                    key={option} 
                    value={option}
                    className={`p-2 ${
                      darkMode 
                        ? 'hover:bg-gray-700' 
                        : 'hover:bg-blue-100'
                    } cursor-pointer`}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {formData[field.name].length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData[field.name].map(value => (
                  <span 
                    key={value}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      darkMode 
                        ? 'bg-blue-900 text-blue-200 border border-blue-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {value}
                    <button
                      type="button"
                      onClick={() => {
                        const newValues = formData[field.name].filter(v => v !== value);
                        setFormData(prev => ({
                          ...prev,
                          [field.name]: newValues
                        }));
                      }}
                      className={`ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full ${
                        darkMode 
                          ? 'hover:bg-blue-800' 
                          : 'hover:bg-blue-200'
                      } focus:outline-none`}
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Hold Ctrl (Windows) or Command (Mac) to select multiple options
            </p>
          </div>
        );
      case 'date':
        return (
          <input
            ref={formRefs[field.name]}
            type="date"
            name={field.name}
            value={formData[field.name]}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className={`${baseClasses} ${activeClasses}`}
            required={field.required}
          />
        );
      case 'tags':
        return (
          <div className="space-y-2">
            <input
              ref={formRefs[field.name]}
              type="text"
              name={field.name}
              value={formData[field.name].join(', ')}
              onChange={handleTagsChange}
              onKeyPress={handleKeyPress}
              className={`${baseClasses} ${activeClasses}`}
              placeholder="Enter tags separated by commas"
              required={field.required}
            />
            {formData[field.name].length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData[field.name].map(tag => (
                  <span 
                    key={tag}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      darkMode 
                        ? 'bg-green-900 text-green-200 border border-green-800' 
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = formData[field.name].filter(t => t !== tag);
                        setFormData(prev => ({
                          ...prev,
                          [field.name]: newTags
                        }));
                      }}
                      className={`ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full ${
                        darkMode 
                          ? 'hover:bg-green-800' 
                          : 'hover:bg-green-200'
                      } focus:outline-none`}
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (currentStep === -1) {
    return (
      <div className={`fixed inset-0 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-white'} flex items-center justify-center`}>
        <div className={`w-full max-w-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl rounded-2xl overflow-hidden`}>
          <div className="p-8 md:p-12">
            <div className="flex justify-end mb-6">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {darkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="space-y-6">
              <div className="animate-fade-in-up">
                <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Contract Document Form
                </h1>
                <div className="h-1 w-20 bg-blue-500 rounded-full"></div>
              </div>
              
              <div className="animate-fade-in-up">
                <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Let's create your contract document step by step. We'll guide you through each field to ensure all necessary information is captured accurately.
                </p>
              </div>

              <div className="animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className={`flex items-center space-x-3 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Step-by-step guidance</span>
                  </div>
                  <div className={`flex items-center space-x-3 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Easy navigation</span>
                  </div>
                  <div className={`flex items-center space-x-3 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Smart validation</span>
                  </div>
                </div>
              </div>

              <div className="animate-fade-in-up">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="mt-8 w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105"
                >
                  Get Started
                  <svg className="w-5 h-5 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentField = formFields[currentStep];
  const isFieldComplete = isFieldValid(currentField);

  return (
    <div className={`fixed inset-0 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex items-start justify-center py-8">
          <div className={`max-w-3xl w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl rounded-2xl transition-colors duration-300`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Contract Document Form</h1>
                  <div className="flex items-center space-x-2">
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Step {currentStep + 1} of {formFields.length}
                    </div>
                    <div className="h-1 flex-1 bg-gray-200 rounded-full max-w-xs">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${((currentStep + 1) / formFields.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {darkMode ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  {completedFields.map((fieldName, index) => {
                    const field = formFields.find(f => f.name === fieldName);
                    const value = formData[fieldName];
                    return (
                      <div 
                        key={fieldName}
                        className={`transition-all duration-500 transform translate-y-0 opacity-100 ${
                          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'
                        } rounded-xl p-4 border`}
                      >
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className={`p-3 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                          {Array.isArray(value) ? (
                            <div className="flex flex-wrap gap-2">
                              {value.map(v => (
                                <span 
                                  key={v}
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    darkMode 
                                      ? 'bg-blue-900 text-blue-200 border border-blue-800' 
                                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                                  }`}
                                >
                                  {v}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{value}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div 
                    className={`transition-all duration-500 transform translate-y-0 opacity-100 rounded-xl p-6 shadow-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-blue-100'
                    }`}
                  >
                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                      {currentField.label}
                      {currentField.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="transition-all duration-300">
                      {renderField(currentField)}
                    </div>
                    {!isFieldComplete && currentField.required && (
                      <p className="mt-2 text-sm text-red-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        This field is required
                      </p>
                    )}
                  </div>
                </div>

                <div className={`flex justify-between mt-10 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                      currentStep === 0
                        ? darkMode 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Previous</span>
                  </button>

                  {currentStep < formFields.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!isFieldComplete}
                      className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                        isFieldComplete
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : darkMode
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Next</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!isFieldComplete}
                      className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                        isFieldComplete
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : darkMode
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Submit</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractForm; 