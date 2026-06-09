import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Marksheet from '../../components/Marksheet';

export default function StudentResultsPublic() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const res = await api.get('/exams');
      // Get published exams
      const publishedExams = res.data.exams?.filter(e => e.resultsPublished) || [];
      setExams(publishedExams);
    } catch (err) {
      console.error(err);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setError('');
    setResult(null);
    setHasSearched(true);

    try {
      if (!selectedExam) {
        setError('Please select an exam');
        setSearching(false);
        return;
      }

      if (!studentName.trim()) {
        setError('Please enter student name');
        setSearching(false);
        return;
      }

      if (!rollNumber.trim()) {
        setError('Please enter roll number');
        setSearching(false);
        return;
      }

      // Fetch all results for the exam and filter by name and roll number
      const res = await api.get(`/exams/${selectedExam}/results`);
      const allResults = res.data.results || [];

      // Filter by name and roll number
      const filtered = allResults.filter(r => {
        const resultName = (r.student?.user?.name || r.student?.fullName || '').toLowerCase().trim();
        const resultRoll = (r.student?.rollNumber || r.student?.admissionNumber || '').toLowerCase().trim();
        
        const searchName = studentName.toLowerCase().trim();
        const searchRoll = rollNumber.toLowerCase().trim();

        return resultName.includes(searchName) && resultRoll.includes(searchRoll);
      });

      if (filtered.length === 0) {
        setError('Student not found in this exam. Please verify:\n• Correct exam is selected\n• Student name matches exactly\n• Roll number is correct');
      } else {
        setResult(filtered[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching result. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('Use Print button and select "Save as PDF" option in the print dialog to download as PDF.');
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Student Results</h1>
          <p className="text-slate-600">Search your examination results by name and roll number</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {loading ? (
            <div className="text-center text-slate-500">Loading exams...</div>
          ) : (
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Exam *</label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Choose an Exam --</option>
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.type} - {exam.class?.name || 'N/A'} ({exam.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Student Name *</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Roll Number *</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Enter your roll number"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {searching ? 'Searching...' : 'Search Result'}
              </button>
            </form>
          )}
        </div>

        {/* Error Message */}
        {error && hasSearched && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            <p className="font-semibold">⚠ {error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="space-y-4">
            <div className="flex gap-2 print:hidden">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
              >
                Download PDF
              </button>
            </div>
            <Marksheet result={result} exam={exams.find(e => e._id === selectedExam)} />
          </div>
        )}

        {/* No Result Message */}
        {hasSearched && !result && !error && !searching && (
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 text-center text-slate-600">
            <p>No result found. Please check your details and try again.</p>
          </div>
        )}

        {/* Info Message */}
        {!hasSearched && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-slate-600">
            <p>Fill in the form above to search for your results</p>
          </div>
        )}
      </div>
    </div>
  );
}
