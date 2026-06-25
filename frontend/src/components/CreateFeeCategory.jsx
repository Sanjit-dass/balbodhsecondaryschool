import React, { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * CreateFeeCategory Component
 * Assign fee categories to a class
 * - Mandatory items are applied to all students automatically
 * - Optional items can be selected per student
 */
const CreateFeeCategory = () => {
  const [step, setStep] = useState(1); // 1: Select Class, 2: Add Items
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [mandatory, setMandatory] = useState([
    { name: '', amount: '', description: '' }
  ]);
  
  const [submitting, setSubmitting] = useState(false);

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch sorted classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fees/classes-dropdown');
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch classes: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current fee structure when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchCurrentStructure();
    }
  }, [selectedClass]);

  const fetchCurrentStructure = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/fees/class/${selectedClass._id}/fee-structure`);
      if (response.data.success) {
        setClassDetails(response.data.data);
        
        // Pre-populate form with existing items
        const mandatoryItems = response.data.data.mandatory.items.map(item => ({
          name: item.name,
          amount: item.amount || '',
          description: item.description || '',
          status: item.status || 'active'
        }));
        
        setMandatory(mandatoryItems.length > 0 ? mandatoryItems : [{ name: '', amount: '', description: '' }]);
      }
    } catch (err) {
      console.error('Error fetching structure:', err);
      // Initialize with empty forms if no structure exists
      setMandatory([{ name: '', amount: '', description: '' }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle class selection
  const handleSelectClass = (classData) => {
    setSelectedClass(classData);
    setError('');
    setSuccess('');
    setStep(2);
  };

  // Add new mandatory item row
  const addMandatoryItem = () => {
    setMandatory([...mandatory, { name: '', amount: '', description: '' }]);
  };


  // Remove mandatory item
  const removeMandatoryItem = (index) => {
    if (mandatory.length > 1) {
      setMandatory(mandatory.filter((_, i) => i !== index));
    }
  };


  // Update mandatory item
  const updateMandatoryItem = (index, field, value) => {
    const updated = [...mandatory];
    updated[index][field] = value;
    setMandatory(updated);
  };


  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    // Validate at least one mandatory item
    const mandatoryValid = mandatory.some(item => item.name.trim() && item.amount);
    if (!mandatoryValid) {
      setError('Please add at least one fee category');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      // Filter out empty rows and validate
      const mandatoryData = mandatory
        .filter(item => item.name.trim() && item.amount)
        .map(item => ({
          name: item.name.trim(),
          amount: Number(item.amount),
          description: item.description.trim() || '',
          status: item.status || 'active',
          type: 'Mandatory'
        }));

      // Optional items are intentionally omitted from the class assignment UI — send an empty array.
      const optionalData = [];

      if (mandatoryData.length === 0 && optionalData.length === 0) {
        setError('Please fill in at least one complete fee item');
        return;
      }

      const response = await api.post(
        `/fees/class/${selectedClass._id}/assign-categories`,
        {
          mandatory: mandatoryData,
          optional: optionalData
        }
      );

      if (response.data.success) {
        setSuccess(`✓ Successfully assigned ${response.data.data.created.length} new and updated ${response.data.data.updated.length} categories to ${selectedClass.displayName}`);
        setError('');
        
        // Refresh structure
        setTimeout(() => {
          fetchCurrentStructure();
        }, 500);
      }
    } catch (err) {
      setError('Failed to assign categories: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 Fee Category Assignment</h1>
          <p className="text-gray-600 text-lg">
            Assign mandatory fee items to a class. 
            <span className="block mt-2">
              • <strong>Mandatory items</strong> are applied automatically to all students
            </span>
          </p>
        </div>

        {/* Step 1: Class Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 1: Select a Class</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading classes...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* HTML Select Dropdown */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">Class</label>
                  <select
                    onChange={(e) => {
                      const selected = classes.find(c => c._id === e.target.value);
                      if (selected) {
                        handleSelectClass(selected);
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-medium"
                    defaultValue=""
                  >
                    <option value="">-- Select class --</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.displayName}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-2">Classes are arranged in order: Nursery, LKG, UKG, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10</p>
                </div>

                {/* Alternative: Button Grid Selection */}
                <div>
                  <p className="text-lg font-semibold text-gray-700 mb-3">Or click to select:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {classes.map((cls) => (
                      <button
                        key={cls._id}
                        onClick={() => handleSelectClass(cls)}
                        className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-700 hover:text-blue-600"
                      >
                        {cls.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Fee Items Assignment */}
        {step === 2 && selectedClass && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Step 2: Assign Fee Categories to {selectedClass.displayName}
                </h2>
                <p className="text-gray-600">
                  Add all fee items for this class. You can edit or delete items later.
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
              >
                ← Change Class
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Current Structure Summary (optional items hidden) */}
              {classDetails && classDetails.mandatory.count > 0 && (
                <div className="mb-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h3 className="font-bold text-indigo-900 mb-4">📊 Current Fee Structure</h3>
                  <div>
                    <p className="text-sm text-indigo-700 font-semibold mb-2">MANDATORY ITEMS</p>
                    {classDetails.mandatory.items.map((item, i) => (
                      <p key={i} className="text-sm text-indigo-600">
                        • {item.name}: ₹{item.amount}
                      </p>
                    ))}
                    <p className="text-sm font-bold text-indigo-900 mt-2">
                      Subtotal: ₹{classDetails.mandatory.total}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-indigo-200">
                    <p className="text-lg font-bold text-indigo-900">
                      💰 Total Fee: ₹{classDetails.summary.grandTotal}
                    </p>
                  </div>
                </div>
              )}

              {/* Mandatory Fees Section */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">✓ Mandatory Fees</h3>
                  <span className="ml-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold">
                    Applied to all students
                  </span>
                </div>

                <div className="space-y-4 mb-4">
                  {mandatory.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fee Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Tuition Fee, Lab Fee, etc."
                          value={item.name}
                          onChange={(e) => updateMandatoryItem(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:w-32 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount (₹) *
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={item.amount}
                          onChange={(e) => updateMandatoryItem(index, 'amount', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          placeholder="Optional description"
                          value={item.description}
                          onChange={(e) => updateMandatoryItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:flex md:items-end md:justify-end w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => removeMandatoryItem(index)}
                          disabled={mandatory.length === 1}
                          className="w-full md:w-auto px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addMandatoryItem}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition"
                >
                  + Add Mandatory Item
                </button>
              </div>

                      {/* Optional Fees UI removed — only Mandatory Fees are shown here per requirement. */}

              {/* Summary */}
              <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-3">💡 Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 font-semibold">Mandatory Items</p>
                    <p className="text-blue-900 font-bold text-lg">
                      {mandatory.filter(i => i.name && i.amount).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 font-semibold">Estimated Min Fee</p>
                    <p className="text-blue-900 font-bold text-lg">
                      ₹{mandatory
                        .filter(i => i.name && i.amount)
                        .reduce((sum, i) => sum + Number(i.amount || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '⏳ Assigning...' : '✓ Assign Categories'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateFeeCategory;
